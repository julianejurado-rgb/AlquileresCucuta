package com.estudiocucuta.controlador;

import com.estudiocucuta.dto.AnuncioDto;
import com.estudiocucuta.dto.CambioContrasenaRequest;
import com.estudiocucuta.dto.CuentaDto;
import com.estudiocucuta.dto.DatosCuentaRequest;
import com.estudiocucuta.seguridad.SesionActual;
import com.estudiocucuta.servicio.AnuncioService;
import com.estudiocucuta.servicio.UsuarioService;
import com.estudiocucuta.servicio.VerificacionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** La cuenta del usuario con sesión iniciada (perfil.html y mis-publicaciones.html). */
@RestController
@RequestMapping("/api/cuenta")
public class CuentaController {

    private final UsuarioService usuarioService;
    private final AnuncioService anuncioService;
    private final VerificacionService verificacionService;
    private final SesionActual sesionActual;

    public CuentaController(UsuarioService usuarioService,
                            AnuncioService anuncioService,
                            VerificacionService verificacionService,
                            SesionActual sesionActual) {
        this.usuarioService = usuarioService;
        this.anuncioService = anuncioService;
        this.verificacionService = verificacionService;
        this.sesionActual = sesionActual;
    }

    @PutMapping
    public CuentaDto actualizarDatos(@Valid @RequestBody DatosCuentaRequest datos) {
        return usuarioService.actualizarDatos(sesionActual.requerirUsuario().getId(), datos);
    }

    @PutMapping("/contrasena")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cambiarContrasena(@Valid @RequestBody CambioContrasenaRequest datos) {
        usuarioService.cambiarContrasena(sesionActual.requerirUsuario().getId(), datos);
    }

    /** Elimina la cuenta con todos sus anuncios y cierra la sesión. */
    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarCuenta(HttpServletRequest request, HttpServletResponse response) {
        usuarioService.eliminarCuentaPropia(sesionActual.requerirUsuario().getId());
        new SecurityContextLogoutHandler().logout(request, response, SecurityContextHolder.getContext().getAuthentication());
    }

    @GetMapping("/anuncios")
    public List<AnuncioDto> misAnuncios() {
        return anuncioService.misAnuncios(sesionActual.requerirUsuario().getId());
    }

    @PostMapping("/verificacion")
    @ResponseStatus(HttpStatus.CREATED)
    public void solicitarVerificacion() {
        verificacionService.solicitar(sesionActual.requerirUsuario().getId());
    }
}
