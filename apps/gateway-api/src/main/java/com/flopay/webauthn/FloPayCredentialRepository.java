package com.flopay.webauthn;

import com.flopay.consumer.User;
import com.flopay.consumer.UserRepository;
import com.yubico.webauthn.CredentialRepository;
import com.yubico.webauthn.RegisteredCredential;
import com.yubico.webauthn.data.ByteArray;
import com.yubico.webauthn.data.PublicKeyCredentialDescriptor;
import com.yubico.webauthn.data.exception.Base64UrlException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * The lookup surface {@link com.yubico.webauthn.RelyingParty} needs — backed
 * by our own {@link User}/{@link WebAuthnCredential} tables rather than a
 * dedicated WebAuthn user store. "Username" throughout this interface is the
 * consumer's phone number, the same identifier the OTP login flow uses.
 */
@Component
@RequiredArgsConstructor
class FloPayCredentialRepository implements CredentialRepository {

    private final UserRepository userRepository;
    private final WebAuthnCredentialRepository webAuthnCredentialRepository;

    @Override
    public Set<PublicKeyCredentialDescriptor> getCredentialIdsForUsername(String username) {
        return userRepository.findByPhone(username)
                .map(user -> webAuthnCredentialRepository.findByUserId(user.getId()).stream()
                        .map(c -> PublicKeyCredentialDescriptor.builder()
                                .id(decode(c.getCredentialIdBase64()))
                                .build())
                        .collect(Collectors.toSet()))
                .orElse(Set.of());
    }

    @Override
    public Optional<ByteArray> getUserHandleForUsername(String username) {
        return userRepository.findByPhone(username).map(User::getId).map(UserHandles::of);
    }

    @Override
    public Optional<String> getUsernameForUserHandle(ByteArray userHandle) {
        return userRepository.findById(UserHandles.toUserId(userHandle)).map(User::getPhone);
    }

    @Override
    public Optional<RegisteredCredential> lookup(ByteArray credentialId, ByteArray userHandle) {
        Long userId = UserHandles.toUserId(userHandle);
        return webAuthnCredentialRepository.findByCredentialIdBase64(credentialId.getBase64Url())
                .filter(c -> c.getUserId().equals(userId))
                .map(this::toRegisteredCredential);
    }

    @Override
    public Set<RegisteredCredential> lookupAll(ByteArray credentialId) {
        return webAuthnCredentialRepository.findByCredentialIdBase64(credentialId.getBase64Url())
                .map(this::toRegisteredCredential)
                .map(Set::of)
                .orElse(Set.of());
    }

    private RegisteredCredential toRegisteredCredential(WebAuthnCredential credential) {
        return RegisteredCredential.builder()
                .credentialId(decode(credential.getCredentialIdBase64()))
                .userHandle(UserHandles.of(credential.getUserId()))
                .publicKeyCose(decode(credential.getPublicKeyCoseBase64()))
                .signatureCount(credential.getSignatureCount())
                .build();
    }

    /** Decodes our own previously-encoded Base64Url text — a failure here means stored data is corrupt, not a normal-flow error. */
    private static ByteArray decode(String base64Url) {
        try {
            return ByteArray.fromBase64Url(base64Url);
        } catch (Base64UrlException e) {
            throw new IllegalStateException("Corrupt WebAuthn Base64Url value in storage", e);
        }
    }
}
