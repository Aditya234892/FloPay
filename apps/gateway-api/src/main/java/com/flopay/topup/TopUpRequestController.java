package com.flopay.topup;

import com.flopay.security.SecurityUtils;
import com.flopay.topup.dto.TopUpRequestDtos.CreateTopUpRequest;
import com.flopay.topup.dto.TopUpRequestDtos.TopUpRequestResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** "Add money" from the consumer app's side — replaces the old instant-credit /api/wallet/topup. */
@RestController
@RequestMapping("/api/wallet/topup-requests")
@RequiredArgsConstructor
public class TopUpRequestController {

    private final TopUpRequestService topUpRequestService;

    @PostMapping
    public ResponseEntity<TopUpRequestResponse> create(@Valid @RequestBody CreateTopUpRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(topUpRequestService.create(SecurityUtils.currentUserId(), request.amountMinor(), request.note()));
    }

    @GetMapping
    public List<TopUpRequestResponse> history() {
        return topUpRequestService.listForUser(SecurityUtils.currentUserId());
    }
}
