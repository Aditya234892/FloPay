package com.flopay.consumer.dto;

import jakarta.validation.constraints.NotBlank;

public class FavoriteContactDtos {

    private FavoriteContactDtos() {
    }

    public record AddFavoriteRequest(@NotBlank String vpa) {
    }

    public record FavoriteContactResponse(String vpa, String displayName) {
    }
}
