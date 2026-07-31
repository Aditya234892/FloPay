package com.flopay.consumer;

import com.flopay.consumer.dto.PinDtos.PinStatusResponse;
import com.flopay.consumer.dto.PinDtos.SetPinRequest;
import com.flopay.consumer.dto.PinDtos.VerifyPinRequest;
import com.flopay.consumer.dto.PinDtos.VerifyPinResponse;
import com.flopay.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wallet/security/pin")
@RequiredArgsConstructor
public class PinController {

    private final PinService pinService;

    @GetMapping("/status")
    public PinStatusResponse status() {
        return new PinStatusResponse(pinService.hasPinSet(SecurityUtils.currentUserId()));
    }

    @PostMapping
    public void setPin(@Valid @RequestBody SetPinRequest request) {
        pinService.setPin(SecurityUtils.currentUserId(), request.pin());
    }

    @PostMapping("/verify")
    public VerifyPinResponse verify(@Valid @RequestBody VerifyPinRequest request) {
        return new VerifyPinResponse(pinService.verifyPin(SecurityUtils.currentUserId(), request.pin()));
    }
}
