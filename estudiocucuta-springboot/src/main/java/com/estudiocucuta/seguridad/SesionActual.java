package com.estudiocucuta.seguridad;

import com.estudiocucuta.excepcion.ApiException;
import com.estudiocucuta.modelo.Usuario;
import com.estudiocucuta.repositorio.UsuarioRepository;
import java.util.Optional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Usuario con sesión iniciada en la petición actual (antes obtenerUsuarioActual
 * en datos.js). Se busca de nuevo en la base de datos en cada petición, así
 * que si el administrador lo bloquea o lo elimina, pierde el acceso enseguida.
 */
@Component
public class SesionActual {

    private final UsuarioRepository usuarioRepository;

    public SesionActual(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public Optional<Usuario> usuario() {
        Authentication autenticacion = SecurityContextHolder.getContext().getAuthentication();
        if (autenticacion != null && autenticacion.getPrincipal() instanceof UsuarioDetalles detalles) {
            return usuarioRepository.findById(detalles.getId()).filter(usuario -> !usuario.isBloqueado());
        }
        return Optional.empty();
    }

    public Usuario requerirUsuario() {
        return usuario().orElseThrow(() -> ApiException.noAutenticado("Debes iniciar sesión."));
    }

    public Usuario requerirAdministrador() {
        Usuario usuario = requerirUsuario();
        if (!usuario.esAdministrador()) {
            throw ApiException.prohibido("Solo un administrador puede hacer esto.");
        }
        return usuario;
    }
}
