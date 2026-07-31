package com.flopay.audit;

import com.flopay.audit.dto.AuditLogDtos.AuditLogResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void record(String actorType, Long actorId, String action, String details, String ipAddress) {
        auditLogRepository.save(AuditLog.builder()
                .actorType(actorType)
                .actorId(actorId)
                .action(action)
                .details(details)
                .ipAddress(ipAddress)
                .build());
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> recent() {
        return auditLogRepository.findTop200ByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return new AuditLogResponse(
                log.getId().toString(), log.getActorType(), log.getActorId(), log.getAction(),
                log.getDetails(), log.getIpAddress(), log.getCreatedAt());
    }
}
