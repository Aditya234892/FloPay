package com.flopay.ledger;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PostingRepository extends JpaRepository<Posting, Long> {

    List<Posting> findByEntryId(UUID entryId);
}
