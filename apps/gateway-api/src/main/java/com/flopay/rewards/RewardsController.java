package com.flopay.rewards;

import com.flopay.rewards.dto.RewardsDtos.RewardHistoryEntry;
import com.flopay.rewards.dto.RewardsDtos.RewardsResponse;
import com.flopay.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/wallet/rewards")
@RequiredArgsConstructor
public class RewardsController {

    private final RewardsService rewardsService;

    @GetMapping
    public RewardsResponse getBalance() {
        return rewardsService.getBalance(SecurityUtils.currentUserId());
    }

    @GetMapping("/history")
    public List<RewardHistoryEntry> getHistory() {
        return rewardsService.getHistory(SecurityUtils.currentUserId());
    }
}
