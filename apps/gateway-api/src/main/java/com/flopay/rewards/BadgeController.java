package com.flopay.rewards;

import com.flopay.rewards.dto.BadgeDtos.BadgeResponse;
import com.flopay.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/wallet/rewards/badges")
@RequiredArgsConstructor
public class BadgeController {

    private final BadgeService badgeService;

    @GetMapping
    public List<BadgeResponse> list() {
        return badgeService.listForUser(SecurityUtils.currentUserId());
    }
}
