package com.flopay.consumer;

import com.flopay.consumer.dto.ConsumerAuthDtos.VpaSuggestion;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class VpaService {

    private static final String DOMAIN = "@flopay";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;

    /**
     * Derives a readable handle from the phone's last 6 digits, falling back to
     * a random numeric suffix on collision — two different phone numbers can
     * share a last-6-digits suffix, so collision is expected, not exceptional.
     * Used to give a brand-new account a working VPA immediately, before the
     * user has picked one of their own in the "choose your FloPay ID" step.
     */
    public String generateVpa(String phone) {
        String base = phone.length() >= 6 ? phone.substring(phone.length() - 6) : phone;
        String candidate = base + DOMAIN;

        while (userRepository.existsByVpa(candidate)) {
            candidate = base + RANDOM.nextInt(1000) + DOMAIN;
        }
        return candidate;
    }

    public boolean isAvailable(String vpa) {
        return !userRepository.existsByVpa(vpa.toLowerCase());
    }

    /**
     * Name-based and phone-based candidates, each annotated with live
     * availability rather than silently skipped when taken — the caller
     * (the "choose your FloPay ID" screen) shows taken ones struck through
     * instead of just thinning the list, since a name-first candidate
     * disappearing without explanation reads as broken, not busy.
     *
     * <p>{@code currentVpa} is the placeholder auto-assigned at first login —
     * it always "exists" (the caller already owns it), but re-selecting it is
     * a no-op the profile-complete flow explicitly allows, so it's shown as
     * available rather than confusingly struck through as taken by someone
     * else.
     */
    public List<VpaSuggestion> suggest(String phone, String displayName, String currentVpa) {
        Set<String> bases = new LinkedHashSet<>();

        if (displayName != null && !displayName.isBlank()) {
            String slug = displayName.toLowerCase().replaceAll("[^a-z0-9]", "");
            if (slug.length() >= 3) {
                bases.add(slug.length() > 20 ? slug.substring(0, 20) : slug);
            }
        }
        if (phone.length() >= 6) {
            bases.add(phone.substring(phone.length() - 6));
        }
        bases.add(phone);

        List<VpaSuggestion> suggestions = new ArrayList<>();
        for (String base : bases) {
            String candidate = base + DOMAIN;
            boolean available = candidate.equals(currentVpa) || isAvailable(candidate);
            suggestions.add(new VpaSuggestion(candidate, available));
        }
        // At least one guaranteed-fresh option, so the screen is never a wall
        // of taken suggestions with nothing to tap.
        String seedBase = bases.iterator().next();
        String fallback;
        do {
            fallback = seedBase + RANDOM.nextInt(10_000) + DOMAIN;
        } while (!isAvailable(fallback));
        suggestions.add(new VpaSuggestion(fallback, true));

        return suggestions;
    }
}
