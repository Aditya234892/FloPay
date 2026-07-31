package com.flopay.rewards;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface UserBadgeRepository extends JpaRepository<UserBadge, UUID> {

    List<UserBadge> findByUserId(Long userId);

    boolean existsByUserIdAndBadgeType(Long userId, BadgeType badgeType);
}
