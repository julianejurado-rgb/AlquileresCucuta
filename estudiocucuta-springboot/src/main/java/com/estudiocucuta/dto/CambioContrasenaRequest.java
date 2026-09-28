package com.estudiocucuta.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CambioContrasenaRequest(
        @NotBlank(message = "Escribe tu contraseña actual.")
        String actual,

        @NotBlank(message = "La contraseña nueva debe tener al menos 6 caracteres.")
        @Size(min = 6, max = 72, message = "La contraseña nueva debe tener entre 6 y 72 caracteres.")
        String nueva) {
}
