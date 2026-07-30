package com.flopay.transfer;

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
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Real HTTP-shaped requests against real Postgres, same discipline as
 * ConsumerWalletFlowTest and LedgerServiceTest — this is the test that
 * actually proves money moves correctly between two independent wallets, not
 * just that LedgerService.post() balances a single entry in isolation.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles({"dev", "local"})
class TransferFlowTest {

    private static final SecureRandom RANDOM = new SecureRandom();

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private OtpChallengeRepository otpChallengeRepository;
    @Autowired
    private AccountRepository accountRepository;
    @Autowired
    private PostingRepository postingRepository;
    @Autowired
    private JournalEntryRepository journalEntryRepository;

    private String phoneA;
    private String phoneB;

    @BeforeEach
    void setUp() {
        phoneA = "9" + "%09d".formatted(RANDOM.nextInt(1_000_000_000));
        phoneB = "9" + "%09d".formatted(RANDOM.nextInt(1_000_000_000));
    }

    @AfterEach
    void tearDown() {
        for (String phone : List.of(phoneA, phoneB)) {
            otpChallengeRepository.findFirstByPhoneAndConsumedFalseOrderByCreatedAtDesc(phone)
                    .ifPresent(c -> otpChallengeRepository.deleteById(c.getId()));
            userRepository.findByPhone(phone).ifPresent(user -> {
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

    private Onboarded onboard(String phone) throws Exception {
        String requestBody = objectMapper.writeValueAsString(new PhoneBody(phone));
        String requestResponse = mockMvc.perform(post("/api/wallet/auth/otp/request")
                        .contentType(MediaType.APPLICATION_JSON).content(requestBody))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String otp = objectMapper.readTree(requestResponse).get("sandboxOtp").asText();

        String verifyResponse = mockMvc.perform(post("/api/wallet/auth/otp/verify").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VerifyBody(phone, otp))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode auth = objectMapper.readTree(verifyResponse);
        return new Onboarded(auth.get("token").asText(), auth.get("userId").asLong(), auth.get("vpa").asText());
    }

    private void topUp(String token, long amountMinor) throws Exception {
        mockMvc.perform(post("/api/wallet/topup").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TopUpBody(amountMinor, UUID.randomUUID().toString()))))
                .andExpect(status().isOk());
    }

    private long balanceOf(String token) throws Exception {
        String response = mockMvc.perform(get("/api/wallet").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("balanceMinor").asLong();
    }

    @Test
    void transferMovesMoneyBetweenTwoRealWalletsWithCorrectCounterpartyInfo() throws Exception {
        Onboarded sender = onboard(phoneA);
        Onboarded receiver = onboard(phoneB);
        topUp(sender.token(), 100_000);

        String idempotencyKey = UUID.randomUUID().toString();
        String transferResponse = mockMvc.perform(post("/api/wallet/transfers")
                        .header("Authorization", "Bearer " + sender.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new TransferBody(receiver.vpa(), 30_000, "for lunch 🍕", idempotencyKey))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode transfer = objectMapper.readTree(transferResponse);
        assertEquals(receiver.vpa(), transfer.get("toVpa").asText());

        assertEquals(70_000L, balanceOf(sender.token()), "sender debited");
        assertEquals(30_000L, balanceOf(receiver.token()), "receiver credited");

        String senderHistory = mockMvc.perform(get("/api/wallet/transactions").header("Authorization", "Bearer " + sender.token()))
                .andReturn().getResponse().getContentAsString();
        JsonNode senderTx = objectMapper.readTree(senderHistory).get(0);
        assertEquals("DEBIT", senderTx.get("direction").asText());
        assertEquals(receiver.vpa(), senderTx.get("counterpartyVpa").asText());
        assertEquals("for lunch 🍕", senderTx.get("note").asText());

        String receiverHistory = mockMvc.perform(get("/api/wallet/transactions").header("Authorization", "Bearer " + receiver.token()))
                .andReturn().getResponse().getContentAsString();
        JsonNode receiverTx = objectMapper.readTree(receiverHistory).get(0);
        assertEquals("CREDIT", receiverTx.get("direction").asText());
        assertEquals(sender.vpa(), receiverTx.get("counterpartyVpa").asText());

        // Retrying the exact same request (network retry simulation) must not move money twice.
        mockMvc.perform(post("/api/wallet/transfers").header("Authorization", "Bearer " + sender.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new TransferBody(receiver.vpa(), 30_000, "for lunch 🍕", idempotencyKey))))
                .andExpect(status().isCreated());
        assertEquals(70_000L, balanceOf(sender.token()), "replay must not debit a second time");
    }

    @Test
    void cannotSendToOwnVpa() throws Exception {
        Onboarded self = onboard(phoneA);
        topUp(self.token(), 50_000);

        mockMvc.perform(post("/api/wallet/transfers").header("Authorization", "Bearer " + self.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new TransferBody(self.vpa(), 1_000, null, UUID.randomUUID().toString()))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsTransferToUnknownVpa() throws Exception {
        Onboarded sender = onboard(phoneA);
        topUp(sender.token(), 50_000);

        mockMvc.perform(post("/api/wallet/transfers").header("Authorization", "Bearer " + sender.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new TransferBody("nobody-here@flopay", 1_000, null, UUID.randomUUID().toString()))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsTransferExceedingBalanceAndLeavesBothWalletsUnchanged() throws Exception {
        Onboarded sender = onboard(phoneA);
        Onboarded receiver = onboard(phoneB);
        topUp(sender.token(), 5_000);

        mockMvc.perform(post("/api/wallet/transfers").header("Authorization", "Bearer " + sender.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new TransferBody(receiver.vpa(), 50_000, null, UUID.randomUUID().toString()))))
                .andExpect(status().isBadRequest());

        assertEquals(5_000L, balanceOf(sender.token()));
        assertEquals(0L, balanceOf(receiver.token()));
    }

    private record PhoneBody(String phone) {
    }

    private record VerifyBody(String phone, String otp) {
    }

    private record TopUpBody(long amountMinor, String idempotencyKey) {
    }

    private record TransferBody(String toVpa, long amountMinor, String note, String idempotencyKey) {
    }
}
