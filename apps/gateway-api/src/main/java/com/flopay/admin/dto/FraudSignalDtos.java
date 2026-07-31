package com.flopay.admin.dto;

public class FraudSignalDtos {

    private FraudSignalDtos() {
    }

    public record FraudSignalResponse(
            Long userId,
            String vpa,
            String displayName,
            boolean frozen,
            long transferCount,
            long totalMinor
    ) {
    }
}
