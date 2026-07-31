package com.flopay.notification;

public enum NotificationType {
    MONEY_RECEIVED,
    REQUEST_RECEIVED,
    /** Not fired separately — approving a request is a real transfer, which already fires MONEY_RECEIVED. */
    REQUEST_DECLINED,
    TOPUP_APPROVED,
    TOPUP_REJECTED
}
