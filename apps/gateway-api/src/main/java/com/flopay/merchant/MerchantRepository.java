package com.flopay.merchant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MerchantRepository extends JpaRepository<Merchant, Long> {
    Optional<Merchant> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByMerchantVpa(String merchantVpa);

    Optional<Merchant> findByMerchantVpa(String merchantVpa);

    /** Admin search — null/blank {@code q} returns every merchant, newest first. */
    @Query("""
            select m from Merchant m
            where (:q is null or :q = ''
                or lower(m.name) like lower(concat('%', :q, '%'))
                or lower(m.email) like lower(concat('%', :q, '%')))
            order by m.createdAt desc
            """)
    List<Merchant> search(@Param("q") String query);
}
