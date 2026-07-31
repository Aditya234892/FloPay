package com.flopay.rewards;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReferralRepository extends JpaRepository<Referral, UUID> {

    Optional<Referral> findByRefereeUserId(Long refereeUserId);

    List<Referral> findByReferrerUserId(Long referrerUserId);

    long countByReferrerUserIdAndStatus(Long referrerUserId, ReferralStatus status);
}
