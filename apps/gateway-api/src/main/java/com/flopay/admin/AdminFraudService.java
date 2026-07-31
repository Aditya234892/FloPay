package com.flopay.admin;

import com.flopay.admin.dto.FraudSignalDtos.FraudSignalResponse;
import com.flopay.consumer.User;
import com.flopay.consumer.UserRepository;
import com.flopay.ledger.PostingRepository;
import com.flopay.ledger.PostingVelocity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * A crude velocity heuristic, not a real fraud model: flags a user whose
 * outbound P2P transfers in the last 24h cross either a count or an amount
 * threshold, for a human admin to look at — never auto-frozen, since a false
 * positive here would lock someone out of their own money.
 */
@Service
@RequiredArgsConstructor
public class AdminFraudService {

    private static final long WINDOW_HOURS = 24;
    private static final long MIN_TRANSFER_COUNT = 10;
    private static final long MIN_TOTAL_MINOR = 50_000_00L; // ₹50,000

    private final PostingRepository postingRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<FraudSignalResponse> velocityOutliers() {
        Instant since = Instant.now().minus(WINDOW_HOURS, ChronoUnit.HOURS);
        List<PostingVelocity> rows = postingRepository.findOutboundVelocity(since, MIN_TRANSFER_COUNT, MIN_TOTAL_MINOR);
        if (rows.isEmpty()) {
            return List.of();
        }

        Map<Long, User> usersById = new LinkedHashMap<>();
        userRepository.findAllById(rows.stream().map(PostingVelocity::userId).toList())
                .forEach(u -> usersById.put(u.getId(), u));

        return rows.stream()
                .sorted((a, b) -> Long.compare(b.totalMinor(), a.totalMinor()))
                .map(row -> {
                    User user = usersById.get(row.userId());
                    return new FraudSignalResponse(
                            row.userId(),
                            user != null ? user.getVpa() : null,
                            user != null ? user.getDisplayName() : null,
                            user != null && user.isFrozen(),
                            row.transferCount(),
                            row.totalMinor());
                })
                .toList();
    }
}
