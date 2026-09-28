package com.estudiocucuta.dto;

import com.estudiocucuta.modelo.Genero;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** El género es obligatorio para los usuarios, no para el administrador (lo revisa UsuarioService). */
public record DatosCuentaRequest(
        @NotBlank(message = "Escribe tu nombre completo.")
        @Size(min = 2, max = 100, message = "Escribe tu nombre completo.")
        String nombre,

        @NotBlank(message = "Escribe un correo electrónico válido.")
        @Pattern(regexp = Validaciones.CORREO, message = "Escribe un correo electrónico válido.")
        @Size(max = 150, message = "El correo es demasiado largo.")
        String correo,

        Genero genero) {
}
