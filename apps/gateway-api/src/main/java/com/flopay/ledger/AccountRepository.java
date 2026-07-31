package com.flopay.ledger;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {

    /**
     * {@code SELECT ... FOR UPDATE} on exactly one row. {@link LedgerService}
     * calls this once per account, in ascending id order, rather than locking
     * several accounts in one query — a single statement's internal
     * row-locking order is not something Postgres actually guarantees to match
     * an ORDER BY, whereas a sequence of single-row locks acquired in a fixed
     * order is the standard, reliable way to make concurrent transactions that
     * touch overlapping accounts (an A→B transfer racing a B→A transfer) block
     * on each other instead of deadlocking.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Account a where a.id = :id")
    Optional<Account> findByIdForUpdate(@Param("id") Long id);

    Optional<Account> findByOwnerTypeAndOwnerIdAndKindAndCurrency(
            AccountOwnerType ownerType, Long ownerId, AccountKind kind, String currency);

    /**
     * Every account kind's balances must net to zero across the whole ledger
     * (double-entry) — this is what lets an admin "wallet health" view assert
     * that invariant still holds rather than trusting it blindly.
     */
    @Query("select coalesce(sum(a.balanceMinor), 0) from Account a where a.kind = :kind")
    long sumBalanceByKind(@Param("kind") AccountKind kind);

    /** Merchants with money still in the settlement hold — what the settlement batch job iterates. */
    List<Account> findByOwnerTypeAndKindAndBalanceMinorGreaterThan(
            AccountOwnerType ownerType, AccountKind kind, long balanceMinor);
}
