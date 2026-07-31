package com.flopay.consumer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByPhone(String phone);

    boolean existsByVpa(String vpa);

    Optional<User> findByVpa(String vpa);

    long countByFrozenTrue();

    boolean existsByReferralCode(String referralCode);

    Optional<User> findByReferralCode(String referralCode);

    /** Admin search — null/blank {@code q} returns every user, newest first. */
    @Query("""
            select u from User u
            where (:q is null or :q = ''
                or lower(u.phone) like lower(concat('%', :q, '%'))
                or lower(u.vpa) like lower(concat('%', :q, '%'))
                or lower(u.displayName) like lower(concat('%', :q, '%')))
            order by u.createdAt desc
            """)
    List<User> search(@Param("q") String query);
}
