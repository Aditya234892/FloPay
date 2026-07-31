package com.flopay.transfer;

import com.flopay.security.SecurityUtils;
import com.flopay.transfer.dto.ScheduledTransferDtos.CreateScheduledTransferRequest;
import com.flopay.transfer.dto.ScheduledTransferDtos.ScheduledTransferResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/wallet/scheduled-transfers")
@RequiredArgsConstructor
public class ScheduledTransferController {

    private final ScheduledTransferService scheduledTransferService;

    @PostMapping
    public ResponseEntity<ScheduledTransferResponse> create(@Valid @RequestBody CreateScheduledTransferRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(scheduledTransferService.create(SecurityUtils.currentUserId(), request));
    }

    @GetMapping
    public List<ScheduledTransferResponse> list() {
        return scheduledTransferService.listForUser(SecurityUtils.currentUserId());
    }

    @DeleteMapping("/{id}")
    public void cancel(@PathVariable UUID id) {
        scheduledTransferService.cancel(SecurityUtils.currentUserId(), id);
    }
}
