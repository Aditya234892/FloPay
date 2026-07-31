package com.flopay.rewards;

import com.flopay.ledger.PostingRepository;
import com.flopay.ledger.PostingVelocity;
import com.flopay.rewards.dto.BadgeDtos.BadgeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BadgeService {

    /** ₹10,000, in minor units — the BIG_SPENDER threshold. */
    private static final long BIG_SPENDER_THRESHOLD_MINOR = 1_000_000L;

    private final UserBadgeRepository userBadgeRepository;
    private final PostingRepository postingRepository;

    /**
     * Idempotent: awarding a badge the user already has is a no-op. The
     * unique (user_id, badge_type) constraint is the actual guarantee — this
     * existence check just avoids a wasted insert-then-catch on the common
     * "already earned" path.
     */
    @Transactional
    public void award(Long userId, BadgeType badgeType) {
        if (userBadgeRepository.existsByUserIdAndBadgeType(userId, badgeType)) {
            return;
        }
        try {
            userBadgeRepository.save(UserBadge.builder().userId(userId).badgeType(badgeType).build());
        } catch (DataIntegrityViolationException alreadyAwarded) {
            // Lost a race with a concurrent award of the same badge — fine, someone got it.
        }
    }

    /** Called after a P2P transfer settles — evaluates every count/amount-based badge in one pass. */
    @Transactional
    public void evaluateAfterTransfer(Long senderUserId) {
        PostingVelocity stats = postingRepository.findLifetimeOutboundStats(senderUserId)
                .orElse(new PostingVelocity(senderUserId, 0L, 0L));

        if (stats.transferCount() >= 1) {
            award(senderUserId, BadgeType.FIRST_TRANSFER);
        }
        if (stats.transferCount() >= 10) {
            award(senderUserId, BadgeType.TEN_TRANSFERS);
        }
        if (stats.totalMinor() >= BIG_SPENDER_THRESHOLD_MINOR) {
            award(senderUserId, BadgeType.BIG_SPENDER);
        }
    }

    @Transactional(readOnly = true)
    public List<BadgeResponse> listForUser(Long userId) {
        Map<BadgeType, UserBadge> earned = userBadgeRepository.findByUserId(userId).stream()
                .collect(Collectors.toMap(UserBadge::getBadgeType, b -> b));

        return Arrays.stream(BadgeType.values())
                .map(type -> {
                    UserBadge badge = earned.get(type);
                    return new BadgeResponse(
                            type.name(), type.title(), type.description(), badge != null,
                            badge != null ? badge.getEarnedAt() : null);
                })
                .toList();
    }
}
