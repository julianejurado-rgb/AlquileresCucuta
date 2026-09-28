package com.estudiocucuta.dto;

import jakarta.validation.constraints.NotNull;

/** Pide abrir (o crear) el chat con el propietario de un anuncio. */
public record ConversacionRequest(
        @NotNull(message = "Falta el anuncio.")
        Long anuncioId) {
}
