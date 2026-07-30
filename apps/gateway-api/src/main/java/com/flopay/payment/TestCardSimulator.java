package com.flopay.payment;

import org.springframework.stereotype.Component;

/**
 * Simulates payment authorization the way Razorpay's documented test cards do:
 * specific well-known numbers/VPAs deterministically succeed or fail so a demo is reproducible.
 */
@Component
public class TestCardSimulator {

    private static final String SUCCESS_CARD = "4111111111111111";
    private static final String FAILURE_CARD = "4000000000000002";
    private static final String SUCCESS_VPA = "success@flopay";
    private static final String FAILURE_VPA = "failure@flopay";

    public record Outcome(boolean success, String reason) {
    }

    public Outcome simulate(PaymentMethod method, String cardNumberOrVpaOrBank) {
        String value = cardNumberOrVpaOrBank == null ? "" : cardNumberOrVpaOrBank.trim();
        return switch (method) {
            case CARD -> switch (value.replace(" ", "")) {
                case FAILURE_CARD -> new Outcome(false, "Card declined by issuing bank");
                case SUCCESS_CARD -> new Outcome(true, null);
                default -> new Outcome(true, null); // any other well-formed test card also succeeds
            };
            case UPI -> value.equalsIgnoreCase(FAILURE_VPA)
                    ? new Outcome(false, "UPI payment declined by customer")
                    : new Outcome(true, null);
            case NETBANKING -> value.equalsIgnoreCase("FAIL_BANK")
                    ? new Outcome(false, "Bank server timeout")
                    : new Outcome(true, null);
        };
    }
}
