package com.flopay.security;

/**
 * What every auth filter in this app sets as the Spring Security principal —
 * a merchant id and a user id are both just Longs, and could numerically
 * collide, so the type travels with the id everywhere rather than being
 * inferred from which filter chain happened to run. {@link SecurityUtils}
 * checks it on every read; a wallet endpoint reached with a merchant token
 * (or vice versa) is rejected there, not just by which routes each filter
 * happens to be wired to.
 */
/** {@code role} is only meaningful for {@link PrincipalType#MERCHANT} — null for USER tokens. */
public record AuthenticatedPrincipal(Long id, PrincipalType type, String role) {
}
