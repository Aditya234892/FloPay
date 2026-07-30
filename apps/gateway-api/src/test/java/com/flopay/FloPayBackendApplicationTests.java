package com.flopay;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * @ActiveProfiles is explicit here rather than relying on the
 * SPRING_PROFILES_ACTIVE env var reaching Surefire's forked test JVM — that
 * forwarding is not guaranteed by every shell/CI setup, and a context-load
 * test that silently skips the "local" profile fails with a confusing
 * datasource error instead of the actual assertion.
 */
@SpringBootTest
@ActiveProfiles({"dev", "local"})
class FloPayBackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
