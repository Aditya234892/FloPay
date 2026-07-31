package com.flopay.ledger;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PostingRepository extends JpaRepository<Posting, Long> {

    List<Posting> findByEntryId(UUID entryId);

    /** Most recent postings against one account, newest first — a plain history view, not paginated yet. */
    List<Posting> findTop50ByAccountIdOrderByIdDesc(Long accountId);

    /** Every posting against an account, uncapped — for cleanup/statement-export use, not the home feed. */
    List<Posting> findByAccountId(Long accountId);

    /**
     * Users whose outbound P2P transfer activity since {@code since} trips
     * either threshold — a crude velocity heuristic, not a real fraud model,
     * but enough to surface "this account just sent money unusually fast" for
     * a human to look at.
     */
    @Query("""
            select new com.flopay.ledger.PostingVelocity(a.ownerId, count(p), sum(p.amountMinor))
            from Posting p join p.account a join p.entry e
            where a.ownerType = com.flopay.ledger.AccountOwnerType.USER
              and a.kind = com.flopay.ledger.AccountKind.WALLET
              and p.direction = com.flopay.ledger.PostingDirection.DEBIT
              and e.kind = 'P2P_TRANSFER'
              and e.createdAt >= :since
            group by a.ownerId
            having count(p) >= :minCount or sum(p.amountMinor) >= :minAmountMinor
            """)
    List<PostingVelocity> findOutboundVelocity(
            @Param("since") Instant since, @Param("minCount") long minCount, @Param("minAmountMinor") long minAmountMinor);

    /** All-time outbound P2P transfer count/total for one user — what achievement-badge criteria are evaluated against. */
    @Query("""
            select new com.flopay.ledger.PostingVelocity(a.ownerId, count(p), sum(p.amountMinor))
            from Posting p join p.account a join p.entry e
            where a.ownerType = com.flopay.ledger.AccountOwnerType.USER
              and a.kind = com.flopay.ledger.AccountKind.WALLET
              and a.ownerId = :userId
              and p.direction = com.flopay.ledger.PostingDirection.DEBIT
              and e.kind = 'P2P_TRANSFER'
            group by a.ownerId
            """)
    Optional<PostingVelocity> findLifetimeOutboundStats(@Param("userId") Long userId);
}
