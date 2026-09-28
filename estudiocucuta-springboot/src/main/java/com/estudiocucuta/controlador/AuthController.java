package com.estudiocucuta.controlador;

import com.estudiocucuta.dto.AccesoRequest;
import com.estudiocucuta.dto.CuentaDto;
import com.estudiocucuta.dto.RegistroRequest;
import com.estudiocucuta.excepcion.ApiException;
import com.estudiocucuta.modelo.Usuario;
import com.estudiocucuta.seguridad.SesionActual;
import com.estudiocucuta.seguridad.UsuarioDetalles;
import com.estudiocucuta.servicio.UsuarioService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Registro, inicio de sesión y consulta de la sesión actual.
 * El cierre de sesión (POST /api/auth/salir) lo atiende Spring Security.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UsuarioService usuarioService;
    private final SesionActual sesionActual;
    private final SecurityContextRepository repositorioContexto = new HttpSessionSecurityContextRepository();

    public AuthController(AuthenticationManager authenticationManager,
                          UsuarioService usuarioService,
                          SesionActual sesionActual) {
        this.authenticationManager = authenticationManager;
        this.usuarioService = usuarioService;
        this.sesionActual = sesionActual;
    }

    /** Crea la cuenta y deja la sesión iniciada, como hacía registro.js. */
    @PostMapping("/registro")
    @ResponseStatus(HttpStatus.CREATED)
    public CuentaDto registrar(@Valid @RequestBody RegistroRequest datos,
                               HttpServletRequest request, HttpServletResponse response) {
        Usuario usuario = usuarioService.registrar(datos);
        iniciarSesion(usuario.getCorreo(), datos.contrasena(), request, response);
        return usuarioService.cuenta(usuario.getId());
    }

    @PostMapping("/acceder")
    public CuentaDto acceder(@Valid @RequestBody AccesoRequest datos,
                             HttpServletRequest request, HttpServletResponse response) {
        UsuarioDetalles detalles = iniciarSesion(datos.correo(), datos.contrasena(), request, response);
        return usuarioService.cuenta(detalles.getId());
    }

    /** 200 con el usuario si hay sesión, 204 si no la hay. */
    @GetMapping("/sesion")
    public ResponseEntity<CuentaDto> sesion() {
        return sesionActual.usuario()
                .map(usuario -> ResponseEntity.ok(usuarioService.cuenta(usuario.getId())))
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    private UsuarioDetalles iniciarSesion(String correo, String contrasena,
                                          HttpServletRequest request, HttpServletResponse response) {
        Authentication autenticacion;
        try {
            autenticacion = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(correo.trim().toLowerCase(), contrasena));
        } catch (LockedException e) {
            throw ApiException.prohibido("Tu cuenta ha sido bloqueada. Contacta al administrador.");
        } catch (AuthenticationException e) {
            throw ApiException.noAutenticado("Correo o contraseña incorrectos.");
        }

        // Guarda la autenticación en la sesión HTTP (cookie JSESSIONID).
        if (request.getSession(false) != null) {
            request.changeSessionId();
        }
        SecurityContext contexto = SecurityContextHolder.createEmptyContext();
        contexto.setAuthentication(autenticacion);
        SecurityContextHolder.setContext(contexto);
        repositorioContexto.saveContext(contexto, request, response);
        return (UsuarioDetalles) autenticacion.getPrincipal();
    }
}
