package com.flopay.consumer;

import com.flopay.consumer.dto.FavoriteContactDtos.AddFavoriteRequest;
import com.flopay.consumer.dto.FavoriteContactDtos.FavoriteContactResponse;
import com.flopay.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wallet/favorites")
@RequiredArgsConstructor
public class FavoriteContactController {

    private final FavoriteContactService favoriteContactService;

    @GetMapping
    public List<FavoriteContactResponse> list() {
        return favoriteContactService.list(SecurityUtils.currentUserId());
    }

    @PostMapping
    public void add(@Valid @RequestBody AddFavoriteRequest request) {
        favoriteContactService.add(SecurityUtils.currentUserId(), request.vpa());
    }

    @DeleteMapping("/{vpa}")
    public void remove(@PathVariable String vpa) {
        favoriteContactService.remove(SecurityUtils.currentUserId(), vpa);
    }
}
