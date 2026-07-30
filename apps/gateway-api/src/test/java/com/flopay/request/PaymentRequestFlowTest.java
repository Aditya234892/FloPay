package com.flopay.request;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.flopay.consumer.OtpChallengeRepository;
import com.flopay.consumer.UserRepository;
import com.flopay.ledger.Account;
import com.flopay.ledger.AccountKind;
import com.flopay.ledger.AccountOwnerType;
import com.flopay.ledger.AccountRepository;
import com.flopay.ledger.JournalEntryRepository;
import com.flopay.ledger.PostingRepository;
import com.flopay.testsupport.LedgerTestCleanup;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles({"dev", "local"})
class PaymentRequestFlowTest {

    private static final SecureRandom RANDOM = new SecureRandom();

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private OtpChallengeRepository otpChallengeRepository;
    @Autowired private AccountRepository accountRepository;
    @Autowired private PostingRepository postingRepository;
    @Autowired private JournalEntryRepository journalEntryRepository;
    @Autowired private PaymentRequestRepository paymentRequestRepository;

    private final List<String> phones = new ArrayList<>();

    @BeforeEach
    void setUp() {
        phones.clear();
    }

    @AfterEach
    void tearDown() {
        for (String phone : phones) {
            otpChallengeRepository.findFirstByPhoneAndConsumedFalseOrderByCreatedAtDesc(phone)
                    .ifPresent(c -> otpChallengeRepository.deleteById(c.getId()));
            userRepository.findByPhone(phone).ifPresent(user -> {
                // Requests reference users, so they must go before the user rows.
                paymentRequestRepository.deleteAll(
                        paymentRequestRepository.findByPayerUserIdOrderByCreatedAtDesc(user.getId()));
                paymentRequestRepository.deleteAll(
                        paymentRequestRepository.findByRequesterUserIdOrderByCreatedAtDesc(user.getId()));
                accountRepository
                        .findByOwnerTypeAndOwnerIdAndKindAndCurrency(
                                AccountOwnerType.USER, user.getId(), AccountKind.WALLET, "INR")
                        .map(Account::getId)
                        .ifPresent(accountId -> LedgerTestCleanup.deleteAccountAndItsHistory(
                                accountId, accountRepository, postingRepository, journalEntryRepository));
                userRepository.deleteById(user.getId());
            });
        }
    }

    private record Onboarded(String token, long userId, String vpa) {
    }

    private Onboarded onboard() throws Exception {
        String phone = "9" + "%09d".formatted(RANDOM.nextInt(1_000_000_000));
        phones.add(phone);

        String requestResponse = mockMvc.perform(post("/api/wallet/auth/otp/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new PhoneBody(phone))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String otp = objectMapper.readTree(requestResponse).get("sandboxOtp").asText();

        String verifyResponse = mockMvc.perform(post("/api/wallet/auth/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VerifyBody(phone, otp))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode auth = objectMapper.readTree(verifyResponse);
        return new Onboarded(auth.get("token").asText(), auth.get("userId").asLong(), auth.get("vpa").asText());
    }

    private void topUp(String token, long amountMinor) throws Exception {
        mockMvc.perform(post("/api/wallet/topup").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new TopUpBody(amountMinor, UUID.randomUUID().toString()))))
                .andExpect(status().isOk());
    }

    private long balanceOf(String token) throws Exception {
        String response = mockMvc.perform(get("/api/wallet").header("Authorization", "Bearer " + token))
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("balanceMinor").asLong();
    }

    @Test
    void approvingARequestMovesRealMoneyAndMarksItPaid() throws Exception {
        Onboarded requester = onboard();
        Onboarded payer = onboard();
        topUp(payer.token(), 100_000);

        String created = mockMvc.perform(post("/api/wallet/requests")
                        .header("Authorization", "Bearer " + requester.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CreateBody(payer.vpa(), 40_000, "concert ticket"))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String requestId = objectMapper.readTree(created).get("id").asText();

        // The payer sees it as incoming; the requester sees it as outgoing.
        String incoming = mockMvc.perform(get("/api/wallet/requests/incoming")
                        .header("Authorization", "Bearer " + payer.token()))
                .andReturn().getResponse().getContentAsString();
        JsonNode incomingFirst = objectMapper.readTree(incoming).get(0);
        assertTrue(incomingFirst.get("incoming").asBoolean());
        assertEquals(requester.vpa(), incomingFirst.get("counterpartyVpa").asText());
        assertEquals("PENDING", incomingFirst.get("status").asText());

        String approved = mockMvc.perform(post("/api/wallet/requests/" + requestId + "/approve")
                        .header("Authorization", "Bearer " + payer.token()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertEquals("PAID", objectMapper.readTree(approved).get("status").asText());

        assertEquals(60_000L, balanceOf(payer.token()), "payer debited");
        assertEquals(40_000L, balanceOf(requester.token()), "requester credited");

        // A PAID request must point at the ledger entry that settled it —
        // otherwise "PAID" is just a flag with nothing behind it.
        PaymentRequest stored = paymentRequestRepository.findById(UUID.fromString(requestId)).orElseThrow();
        assertNotNull(stored.getSettledEntryId(), "PAID request must reference the settling journal entry");
        assertTrue(journalEntryRepository.findById(stored.getSettledEntryId()).isPresent());

        // Approving again must not move money a second time.
        mockMvc.perform(post("/api/wallet/requests/" + requestId + "/approve")
                        .header("Authorization", "Bearer " + payer.token()))
                .andExpect(status().isConflict());
        assertEquals(60_000L, balanceOf(payer.token()), "double approve must not debit twice");
    }

    @Test
    void declinedRequestMovesNoMoney() throws Exception {
        Onboarded requester = onboard();
        Onboarded payer = onboard();
        topUp(payer.token(), 50_000);

        String created = mockMvc.perform(post("/api/wallet/requests")
                        .header("Authorization", "Bearer " + requester.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateBody(payer.vpa(), 10_000, null))))
                .andReturn().getResponse().getContentAsString();
        String requestId = objectMapper.readTree(created).get("id").asText();

        String declined = mockMvc.perform(post("/api/wallet/requests/" + requestId + "/decline")
                        .header("Authorization", "Bearer " + payer.token()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertEquals("DECLINED", objectMapper.readTree(declined).get("status").asText());

        assertEquals(50_000L, balanceOf(payer.token()));
        assertEquals(0L, balanceOf(requester.token()));
    }

    @Test
    void aStrangerCannotApproveSomeoneElsesRequest() throws Exception {
        Onboarded requester = onboard();
        Onboarded payer = onboard();
        Onboarded stranger = onboard();
        topUp(stranger.token(), 100_000);

        String created = mockMvc.perform(post("/api/wallet/requests")
                        .header("Authorization", "Bearer " + requester.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateBody(payer.vpa(), 10_000, null))))
                .andReturn().getResponse().getContentAsString();
        String requestId = objectMapper.readTree(created).get("id").asText();

        mockMvc.perform(post("/api/wallet/requests/" + requestId + "/approve")
                        .header("Authorization", "Bearer " + stranger.token()))
                .andExpect(status().isNotFound());

        assertEquals(100_000L, balanceOf(stranger.token()), "stranger must not have been charged");
    }

    @Test
    void cannotRequestFromYourself() throws Exception {
        Onboarded self = onboard();

        mockMvc.perform(post("/api/wallet/requests")
                        .header("Authorization", "Bearer " + self.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateBody(self.vpa(), 1_000, null))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void splitCreatesOneRequestPerPayerAndSharesSumToTheTotal() throws Exception {
        Onboarded organiser = onboard();
        Onboarded a = onboard();
        Onboarded b = onboard();
        Onboarded c = onboard();

        // 100000 / 3 does not divide evenly — the shares must still total exactly.
        String response = mockMvc.perform(post("/api/wallet/requests/split")
                        .header("Authorization", "Bearer " + organiser.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new SplitBody(100_000, List.of(a.vpa(), b.vpa(), c.vpa()), "dinner"))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        JsonNode summary = objectMapper.readTree(response);
        JsonNode shares = summary.get("shares");
        assertEquals(3, shares.size());

        long total = 0;
        String splitGroupId = summary.get("splitGroupId").asText();
        for (JsonNode share : shares) {
            total += share.get("amountMinor").asLong();
            assertEquals(splitGroupId, share.get("splitGroupId").asText(), "all shares share one group id");
            assertEquals("PENDING", share.get("status").asText());
        }
        assertEquals(100_000L, total, "shares must sum to exactly the bill total");

        // Each payer independently sees their own share as incoming.
        for (Onboarded payer : List.of(a, b, c)) {
            String incoming = mockMvc.perform(get("/api/wallet/requests/incoming")
                            .header("Authorization", "Bearer " + payer.token()))
                    .andReturn().getResponse().getContentAsString();
            assertEquals(1, objectMapper.readTree(incoming).size());
        }
    }

    @Test
    void splitRejectsDuplicatePayers() throws Exception {
        Onboarded organiser = onboard();
        Onboarded a = onboard();

        // Same VPA twice would otherwise silently halve everyone's share.
        String response = mockMvc.perform(post("/api/wallet/requests/split")
                        .header("Authorization", "Bearer " + organiser.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new SplitBody(100_000, List.of(a.vpa(), a.vpa()), "dinner"))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        JsonNode shares = objectMapper.readTree(response).get("shares");
        assertEquals(1, shares.size(), "duplicate payers must collapse to one share");
        assertEquals(100_000L, shares.get(0).get("amountMinor").asLong());
    }

    private record PhoneBody(String phone) {
    }

    private record VerifyBody(String phone, String otp) {
    }

    private record TopUpBody(long amountMinor, String idempotencyKey) {
    }

    private record CreateBody(String fromVpa, long amountMinor, String note) {
    }

    private record SplitBody(long totalAmountMinor, List<String> payerVpas, String note) {
    }
}
