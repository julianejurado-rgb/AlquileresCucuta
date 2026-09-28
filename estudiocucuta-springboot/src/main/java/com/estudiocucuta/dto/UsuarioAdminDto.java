package com.estudiocucuta.dto;

import com.estudiocucuta.modelo.Rol;
import com.estudiocucuta.modelo.Usuario;

/** Fila de la tabla de usuarios del panel admin. */
public record UsuarioAdminDto(Long id, String nombre, String correo, Rol rol, boolean bloqueado, boolean verificado) {

    public static UsuarioAdminDto de(Usuario usuario) {
        return new UsuarioAdminDto(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getCorreo(),
                usuario.getRol(),
                usuario.isBloqueado(),
                usuario.isVerificado());
    }
}
