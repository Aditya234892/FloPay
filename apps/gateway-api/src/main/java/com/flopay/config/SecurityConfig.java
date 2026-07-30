package com.flopay.config;

import com.flopay.merchant.ApiKeyRepository;
import com.flopay.security.ApiKeyAuthFilter;
import com.flopay.security.JsonAuthenticationEntryPoint;
import com.flopay.security.JwtAuthFilter;
import com.flopay.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
public class SecurityConfig {

    /** Comma-separated origin patterns permitted to call the API. */
    private final List<String> allowedOrigins;

    /** The H2 console is only ever routable under the dev profile. */
    private final boolean devProfile;

    public SecurityConfig(
            @Value("${flopay.cors.allowed-origins}") String allowedOrigins,
            Environment environment
    ) {
        this.allowedOrigins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();
        this.devProfile = environment.matchesProfiles("dev");
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /** Payment API: authenticated with merchant API key/secret (Basic Auth), stateless. */
    @Bean
    @Order(1)
    public SecurityFilterChain apiFilterChain(
            HttpSecurity http, ApiKeyRepository apiKeyRepository, PasswordEncoder passwordEncoder
    ) throws Exception {
        http.securityMatcher("/api/v1/**")
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                .exceptionHandling(ex -> ex.authenticationEntryPoint(new JsonAuthenticationEntryPoint(
                        "Authentication failed. Send Basic auth with a valid key_id and key_secret.")))
                .addFilterBefore(
                        new ApiKeyAuthFilter(apiKeyRepository, passwordEncoder),
                        UsernamePasswordAuthenticationFilter.class
                );
        return http.build();
    }

    /**
     * Everything not matched by the payment API chain: merchant dashboard JWT
     * sessions and consumer wallet JWT sessions both land here, since
     * {@link JwtAuthFilter} is generic over principal type — the OTP request/
     * verify endpoints are public (a phone number isn't authenticated yet),
     * everything else requires a JWT, and {@code SecurityUtils} enforces which
     * type of JWT each controller actually accepts.
     */
    @Bean
    @Order(2)
    public SecurityFilterChain dashboardFilterChain(HttpSecurity http, JwtService jwtService) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> {
                    auth.requestMatchers("/api/auth/**", "/api/wallet/auth/**", "/health").permitAll();
                    // Only routable in dev. Leaving this permitAll in a deployed
                    // service hands anyone a full SQL console over the database.
                    if (devProfile) {
                        auth.requestMatchers("/h2-console/**").permitAll();
                    }
                    auth.anyRequest().authenticated();
                })
                .exceptionHandling(ex -> ex.authenticationEntryPoint(new JsonAuthenticationEntryPoint(
                        "Missing or expired session. Log in again.")))
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
                .addFilterBefore(new JwtAuthFilter(jwtService), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // Patterns rather than exact origins so Vercel preview deployments
        // (flopay-*.vercel.app) work without redeploying the backend per branch.
        config.setAllowedOriginPatterns(new ArrayList<>(allowedOrigins));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
