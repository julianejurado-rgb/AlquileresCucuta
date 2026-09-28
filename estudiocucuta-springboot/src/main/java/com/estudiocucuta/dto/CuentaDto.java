package com.estudiocucuta.dto;

import com.estudiocucuta.modelo.Genero;
import com.estudiocucuta.modelo.Rol;
import com.estudiocucuta.modelo.Usuario;

/** Datos del usuario con sesión iniciada (nunca incluye la contraseña). */
public record CuentaDto(
        Long id,
        String nombre,
        String correo,
        Genero genero,
        Rol rol,
        boolean verificado,
        boolean verificacionPendiente) {

    public static CuentaDto de(Usuario usuario, boolean verificacionPendiente) {
        return new CuentaDto(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getCorreo(),
                usuario.getGenero(),
                usuario.getRol(),
                usuario.isVerificado(),
                verificacionPendiente);
    }
}
