package com.estudiocucuta.seguridad;

import com.estudiocucuta.modelo.Usuario;
import java.util.Collection;
import java.util.List;
import org.springframework.security.core.CredentialsContainer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Lo que Spring Security guarda en la sesión sobre el usuario. Solo se usa
 * el id para buscar al usuario actualizado en cada petición (ver SesionActual).
 */
public class UsuarioDetalles implements UserDetails, CredentialsContainer {

    private static final long serialVersionUID = 1L;

    private final Long id;
    private final String correo;
    private final boolean bloqueado;
    private final List<SimpleGrantedAuthority> permisos;
    private String contrasena;

    public UsuarioDetalles(Usuario usuario) {
        this.id = usuario.getId();
        this.correo = usuario.getCorreo();
        this.contrasena = usuario.getContrasena();
        this.bloqueado = usuario.isBloqueado();
        this.permisos = List.of(new SimpleGrantedAuthority("ROLE_" + usuario.getRol().name()));
    }

    public Long getId() {
        return id;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return permisos;
    }

    @Override
    public String getPassword() {
        return contrasena;
    }

    @Override
    public String getUsername() {
        return correo;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    /** Un usuario bloqueado por el administrador no puede iniciar sesión. */
    @Override
    public boolean isAccountNonLocked() {
        return !bloqueado;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    /** Spring Security lo llama después de iniciar sesión para no dejar el hash en la sesión. */
    @Override
    public void eraseCredentials() {
        contrasena = null;
    }
}
