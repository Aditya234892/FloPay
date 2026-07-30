package com.flopay.ledger;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One leg of a {@link JournalEntry} — a single debit or credit against one
 * {@link Account}. {@code amountMinor} is always positive; {@code direction}
 * carries the sign, so the balance arithmetic never has to reason about a
 * negative posting amount meaning something different from a positive one.
 */
@Entity
@Table(name = "posting")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Posting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entry_id", nullable = false)
    private JournalEntry entry;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 6)
    private PostingDirection direction;

    @Column(nullable = false)
    private Long amountMinor;
}
