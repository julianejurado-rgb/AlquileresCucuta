package com.estudiocucuta.dto;

import com.estudiocucuta.modelo.Genero;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegistroRequest(
        @NotBlank(message = "Escribe tu nombre completo.")
        @Size(min = 2, max = 100, message = "Escribe tu nombre completo.")
        String nombre,

        @NotBlank(message = "Escribe un correo electrónico válido.")
        @Pattern(regexp = Validaciones.CORREO, message = "Escribe un correo electrónico válido.")
        @Size(max = 150, message = "El correo es demasiado largo.")
        String correo,

        @NotBlank(message = "La contraseña debe tener al menos 6 caracteres.")
        @Size(min = 6, max = 72, message = "La contraseña debe tener entre 6 y 72 caracteres.")
        String contrasena,

        @NotNull(message = "Selecciona tu género.")
        Genero genero) {
}
