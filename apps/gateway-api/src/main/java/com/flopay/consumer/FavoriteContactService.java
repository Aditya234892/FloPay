package com.flopay.consumer;

import com.flopay.common.ApiException;
import com.flopay.consumer.dto.FavoriteContactDtos.FavoriteContactResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FavoriteContactService {

    private final FavoriteContactRepository favoriteContactRepository;
    private final UserRepository userRepository;

    @Transactional
    public void add(Long userId, String rawVpa) {
        String vpa = rawVpa.trim().toLowerCase();
        User target = userRepository.findByVpa(vpa)
                .orElseThrow(() -> ApiException.badRequest("No FloPay user with VPA " + vpa));
        if (target.getId().equals(userId)) {
            throw ApiException.badRequest("You can't favorite yourself");
        }
        if (favoriteContactRepository.existsByUserIdAndVpa(userId, vpa)) {
            return;
        }
        favoriteContactRepository.save(FavoriteContact.builder().userId(userId).vpa(vpa).build());
    }

    @Transactional
    public void remove(Long userId, String rawVpa) {
        favoriteContactRepository.findByUserIdAndVpa(userId, rawVpa.trim().toLowerCase())
                .ifPresent(favoriteContactRepository::delete);
    }

    @Transactional(readOnly = true)
    public List<FavoriteContactResponse> list(Long userId) {
        return favoriteContactRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(f -> {
                    User user = userRepository.findByVpa(f.getVpa()).orElse(null);
                    return new FavoriteContactResponse(f.getVpa(), user != null ? user.getDisplayName() : null);
                })
                .toList();
    }
}
