package com.flopay.consumer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface OtpChallengeRepository extends JpaRepository<OtpChallenge, Long> {

    Optional<OtpChallenge> findFirstByPhoneAndConsumedFalseOrderByCreatedAtDesc(String phone);

    /** Invalidates any earlier unconsumed codes so only the most recently issued one is ever valid. */
    @Modifying
    @Query("update OtpChallenge o set o.consumed = true where o.phone = :phone and o.consumed = false")
    void invalidateOutstanding(@Param("phone") String phone);
}
