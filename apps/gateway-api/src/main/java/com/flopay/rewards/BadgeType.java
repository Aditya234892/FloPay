package com.flopay.rewards;

/** Fixed catalog of achievements — each one's criteria is evaluated in the service that owns the triggering event. */
public enum BadgeType {
    FIRST_TRANSFER("First transfer", "Sent your first payment on FloPay"),
    TEN_TRANSFERS("Regular", "Sent 10 payments"),
    BIG_SPENDER("Big spender", "Sent over ₹10,000 in total"),
    WEEK_STREAK("Week streak", "Checked in 7 days in a row"),
    REFERRAL_MASTER("Connector", "Referred a friend who sent their first payment"),
    LINK_CREATOR("Link creator", "Created your first payment link");

    private final String title;
    private final String description;

    BadgeType(String title, String description) {
        this.title = title;
        this.description = description;
    }

    public String title() {
        return title;
    }

    public String description() {
        return description;
    }
}
