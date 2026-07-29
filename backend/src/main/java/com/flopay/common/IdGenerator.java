package com.flopay.common;

import java.security.SecureRandom;

public final class IdGenerator {

    private static final String ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private IdGenerator() {
    }

    /** Generates a prefixed, collision-resistant public id, e.g. "order_a1B2c3D4e5F6g7". */
    public static String generate(String prefix) {
        StringBuilder sb = new StringBuilder(prefix);
        for (int i = 0; i < 14; i++) {
            sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }
}
