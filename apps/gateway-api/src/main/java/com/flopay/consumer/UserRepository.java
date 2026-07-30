package com.flopay.consumer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByPhone(String phone);

    boolean existsByVpa(String vpa);

    Optional<User> findByVpa(String vpa);
}
