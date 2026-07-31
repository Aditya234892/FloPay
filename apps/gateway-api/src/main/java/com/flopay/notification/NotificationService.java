package com.flopay.notification;

import com.flopay.notification.dto.NotificationDtos.NotificationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    /**
     * Fire-and-forget from the caller's point of view: a notification failing
     * to write should never fail the money movement it's describing. Callers
     * invoke this after their own transaction's meaningful work is done.
     */
    @Transactional
    public void notify(Long userId, NotificationType type, String title, String body) {
        notificationRepository.save(Notification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .body(body)
                .build());
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> listForUser(Long userId) {
        return notificationRepository.findTop50ByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllRead(userId);
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(n.getId().toString(), n.getType(), n.getTitle(), n.getBody(), n.isRead(), n.getCreatedAt());
    }
}
