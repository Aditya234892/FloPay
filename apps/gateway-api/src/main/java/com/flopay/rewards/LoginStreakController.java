package com.flopay.rewards;

import com.flopay.rewards.dto.LoginStreakDtos.CheckInResponse;
import com.flopay.rewards.dto.LoginStreakDtos.StreakStatusResponse;
import com.flopay.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wallet/rewards/streak")
@RequiredArgsConstructor
public class LoginStreakController {

    private final LoginStreakService loginStreakService;

    @GetMapping
    public StreakStatusResponse status() {
        return loginStreakService.status(SecurityUtils.currentUserId());
    }

    @PostMapping("/check-in")
    public CheckInResponse checkIn() {
        return loginStreakService.checkIn(SecurityUtils.currentUserId());
    }
}
