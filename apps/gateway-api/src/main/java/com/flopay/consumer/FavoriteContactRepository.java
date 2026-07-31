package com.flopay.consumer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteContactRepository extends JpaRepository<FavoriteContact, Long> {

    List<FavoriteContact> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<FavoriteContact> findByUserIdAndVpa(Long userId, String vpa);

    boolean existsByUserIdAndVpa(Long userId, String vpa);
}
