package com.estudiocucuta.dto;

import jakarta.validation.constraints.NotBlank;

public record AccesoRequest(
        @NotBlank(message = "Escribe tu correo electrónico.")
        String correo,

        @NotBlank(message = "Escribe tu contraseña.")
        String contrasena) {
}
