package com.flopay.rewards;

import com.flopay.rewards.dto.ReferralDtos.ReferralSummaryResponse;
import com.flopay.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wallet/rewards/referral")
@RequiredArgsConstructor
public class ReferralController {

    private final ReferralService referralService;

    @GetMapping
    public ReferralSummaryResponse summary() {
        return referralService.summary(SecurityUtils.currentUserId());
    }
}
