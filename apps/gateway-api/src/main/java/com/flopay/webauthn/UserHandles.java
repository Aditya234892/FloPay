package com.flopay.webauthn;

import com.yubico.webauthn.data.ByteArray;

import java.nio.ByteBuffer;

/**
 * WebAuthn's "user handle" is an opaque byte string the relying party
 * chooses — it doesn't need to be random, only stable and not directly
 * equal to the username. The user's own numeric id, big-endian encoded, is
 * exactly that: stable for the account's lifetime and trivially reversible
 * by us (and only us) to look the user back up.
 */
final class UserHandles {

    private UserHandles() {
    }

    static ByteArray of(Long userId) {
        return new ByteArray(ByteBuffer.allocate(Long.BYTES).putLong(userId).array());
    }

    static Long toUserId(ByteArray handle) {
        return ByteBuffer.wrap(handle.getBytes()).getLong();
    }
}
