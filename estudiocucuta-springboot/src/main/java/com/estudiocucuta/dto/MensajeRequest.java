package com.estudiocucuta.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MensajeRequest(
        @NotBlank(message = "Escribe un mensaje.")
        @Size(max = 1000, message = "El mensaje no puede tener más de 1000 caracteres.")
        String texto) {
}
