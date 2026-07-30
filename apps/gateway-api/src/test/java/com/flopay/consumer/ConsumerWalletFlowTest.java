package com.flopay.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.flopay.ledger.Account;
import com.flopay.ledger.AccountKind;
import com.flopay.ledger.AccountOwnerType;
import com.flopay.ledger.AccountRepository;
import com.flopay.security.JwtService;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Exercises the phone+OTP signup flow through real HTTP-shaped requests
 * (MockMvc), not by calling services directly — this is what actually proves
 * SecurityConfig's wiring works: that /api/wallet/auth/** is public, that
 * /api/wallet requires a JWT, and that a merchant token is rejected on a
 * wallet route even though it's a validly-signed JWT.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles({"dev", "local"})
class ConsumerWalletFlowTest {

    private static final SecureRandom RANDOM = new SecureRandom();

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private OtpChallengeRepository otpChallengeRepository;
    @Autowired
    private AccountRepository accountRepository;

    private String phone;

    @BeforeEach
    void setUp() {
        // 10 digits, always starting 9 so it never accidentally collides with
        // a real-looking reserved range.
        phone = "9" + "%09d".formatted(RANDOM.nextInt(1_000_000_000));
    }

    @AfterEach
    void tearDown() {
        otpChallengeRepository.findFirstByPhoneAndConsumedFalseOrderByCreatedAtDesc(phone)
                .ifPresent(c -> otpChallengeRepository.deleteById(c.getId()));
        userRepository.findByPhone(phone).ifPresent(user -> {
            accountRepository
                    .findByOwnerTypeAndOwnerIdAndKindAndCurrency(
                            AccountOwnerType.USER, user.getId(), AccountKind.WALLET, "INR")
                    .map(Account::getId)
                    .ifPresent(accountRepository::deleteById);
            userRepository.deleteById(user.getId());
        });
    }

    @Test
    void firstTimeLoginProvisionsUserAndWalletThenExposesZeroBalance() throws Exception {
        String requestBody = objectMapper.writeValueAsString(new PhoneBody(phone));

        String requestResponse = mockMvc.perform(post("/api/wallet/auth/otp/request")
                        .contentType(MediaType.APPLICATION_JSON).content(requestBody))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String sandboxOtp = objectMapper.readTree(requestResponse).get("sandboxOtp").asText();
        assertEquals(6, sandboxOtp.length());

        // Wrong code must be rejected before we try the real one.
        mockMvc.perform(post("/api/wallet/auth/otp/verify").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VerifyBody(phone, "000000"))))
                .andExpect(status().isBadRequest());

        String verifyResponse = mockMvc.perform(post("/api/wallet/auth/otp/verify").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VerifyBody(phone, sandboxOtp))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode auth = objectMapper.readTree(verifyResponse);
        String token = auth.get("token").asText();
        String vpa = auth.get("vpa").asText();
        assertTrue(vpa.endsWith("@flopay"));

        // No token at all -> 401.
        mockMvc.perform(get("/api/wallet")).andExpect(status().isUnauthorized());

        // A validly-signed token of the WRONG type -> 401, not "works because
        // it's a valid JWT". This is the actual proof the type-check works.
        String merchantToken = jwtService.generateMerchantToken(999_999L, "cross-type-test@example.com");
        mockMvc.perform(get("/api/wallet").header("Authorization", "Bearer " + merchantToken))
                .andExpect(status().isUnauthorized());

        // The real, correctly-typed token works, and the wallet was actually provisioned.
        String walletResponse = mockMvc.perform(get("/api/wallet").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode wallet = objectMapper.readTree(walletResponse);
        assertEquals(vpa, wallet.get("vpa").asText());
        assertEquals(0, wallet.get("balanceMinor").asLong());
        assertEquals("INR", wallet.get("currency").asText());

        mockMvc.perform(get("/api/wallet/transactions").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(content -> assertEquals("[]", content.getResponse().getContentAsString()));

        // Second login for the same phone must NOT create a second user/wallet.
        var secondRequest = mockMvc.perform(post("/api/wallet/auth/otp/request").contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andReturn().getResponse().getContentAsString();
        String secondOtp = objectMapper.readTree(secondRequest).get("sandboxOtp").asText();
        String secondVerify = mockMvc.perform(post("/api/wallet/auth/otp/verify").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VerifyBody(phone, secondOtp))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertEquals(
                auth.get("userId").asLong(),
                objectMapper.readTree(secondVerify).get("userId").asLong(),
                "logging in again with the same phone must return the same user, not create a new one");
    }

    private record PhoneBody(String phone) {
    }

    private record VerifyBody(String phone, String otp) {
    }
}
