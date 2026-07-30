package com.flopay.ledger;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
}
