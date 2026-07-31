package com.flopay.rewards;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "login_streak")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginStreak {

    /** Not generated — this row's identity IS the user's, one-to-one. */
    @Id
    private Long userId;

    @Builder.Default
    @Column(nullable = false)
    private int currentStreak = 0;

    @Builder.Default
    @Column(nullable = false)
    private int longestStreak = 0;

    private LocalDate lastCheckIn;

    @Builder.Default
    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
