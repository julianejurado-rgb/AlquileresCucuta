package com.estudiocucuta.dto;

import com.estudiocucuta.modelo.Usuario;

/**
 * Lo que cualquiera puede ver de un usuario. El correo solo se llena en el
 * detalle de un anuncio (para contactar al propietario) y en el panel admin.
 */
public record UsuarioPublicoDto(Long id, String nombre, boolean verificado, String correo) {

    public static UsuarioPublicoDto de(Usuario usuario) {
        if (usuario == null) {
            return null;
        }
        return new UsuarioPublicoDto(usuario.getId(), usuario.getNombre(), usuario.isVerificado(), null);
    }

    public static UsuarioPublicoDto conCorreo(Usuario usuario) {
        if (usuario == null) {
            return null;
        }
        return new UsuarioPublicoDto(usuario.getId(), usuario.getNombre(), usuario.isVerificado(), usuario.getCorreo());
    }
}
