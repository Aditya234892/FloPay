package com.flopay.ledger;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PostingRepository extends JpaRepository<Posting, Long> {

    List<Posting> findByEntryId(UUID entryId);

    /** Most recent postings against one account, newest first — a plain history view, not paginated yet. */
    List<Posting> findTop50ByAccountIdOrderByIdDesc(Long accountId);
}
