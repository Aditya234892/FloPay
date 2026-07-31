package com.flopay.notification;

import com.flopay.notification.dto.NotificationDtos.NotificationResponse;
import com.flopay.notification.dto.NotificationDtos.UnreadCountResponse;
import com.flopay.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wallet/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public List<NotificationResponse> list() {
        return notificationService.listForUser(SecurityUtils.currentUserId());
    }

    @GetMapping("/unread-count")
    public UnreadCountResponse unreadCount() {
        return new UnreadCountResponse(notificationService.unreadCount(SecurityUtils.currentUserId()));
    }

    @PostMapping("/mark-read")
    public void markRead() {
        notificationService.markAllRead(SecurityUtils.currentUserId());
    }
}
