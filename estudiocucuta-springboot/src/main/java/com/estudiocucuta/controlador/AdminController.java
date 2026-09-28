package com.estudiocucuta.controlador;

import com.estudiocucuta.dto.AnuncioDto;
import com.estudiocucuta.dto.BloqueoRequest;
import com.estudiocucuta.dto.PendientesDto;
import com.estudiocucuta.dto.ReporteDto;
import com.estudiocucuta.dto.SolicitudVerificacionDto;
import com.estudiocucuta.dto.UsuarioAdminDto;
import com.estudiocucuta.modelo.Usuario;
import com.estudiocucuta.seguridad.SesionActual;
import com.estudiocucuta.servicio.AnuncioService;
import com.estudiocucuta.servicio.ReporteService;
import com.estudiocucuta.servicio.UsuarioService;
import com.estudiocucuta.servicio.VerificacionService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Panel de administración (admin.html). SeguridadConfig ya exige el rol
 * ADMINISTRADOR para /api/admin/**; aquí se vuelve a comprobar por si el
 * administrador fue bloqueado con la sesión abierta.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AnuncioService anuncioService;
    private final UsuarioService usuarioService;
    private final ReporteService reporteService;
    private final VerificacionService verificacionService;
    private final SesionActual sesionActual;

    public AdminController(AnuncioService anuncioService,
                           UsuarioService usuarioService,
                           ReporteService reporteService,
                           VerificacionService verificacionService,
                           SesionActual sesionActual) {
        this.anuncioService = anuncioService;
        this.usuarioService = usuarioService;
        this.reporteService = reporteService;
        this.verificacionService = verificacionService;
        this.sesionActual = sesionActual;
    }

    /** Contador del enlace "Panel admin" en el menú. */
    @GetMapping("/pendientes")
    public PendientesDto pendientes() {
        sesionActual.requerirAdministrador();
        return new PendientesDto(reporteService.contarPendientes(), verificacionService.contarPendientes());
    }

    @GetMapping("/anuncios")
    public List<AnuncioDto> anuncios() {
        sesionActual.requerirAdministrador();
        return anuncioService.todos();
    }

    @GetMapping("/usuarios")
    public List<UsuarioAdminDto> usuarios() {
        sesionActual.requerirAdministrador();
        return usuarioService.listar();
    }

    @PutMapping("/usuarios/{id}/bloqueo")
    public UsuarioAdminDto cambiarBloqueo(@PathVariable("id") Long id, @RequestBody BloqueoRequest datos) {
        Usuario administrador = sesionActual.requerirAdministrador();
        return usuarioService.cambiarBloqueo(id, datos.bloqueado(), administrador);
    }

    @DeleteMapping("/usuarios/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarUsuario(@PathVariable("id") Long id) {
        Usuario administrador = sesionActual.requerirAdministrador();
        usuarioService.eliminarPorAdministrador(id, administrador);
    }

    @GetMapping("/reportes")
    public List<ReporteDto> reportes() {
        sesionActual.requerirAdministrador();
        return reporteService.pendientes();
    }

    @PutMapping("/reportes/{id}/resuelto")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resolverReporte(@PathVariable("id") Long id) {
        sesionActual.requerirAdministrador();
        reporteService.marcarResuelto(id);
    }

    @GetMapping("/verificaciones")
    public List<SolicitudVerificacionDto> verificaciones() {
        sesionActual.requerirAdministrador();
        return verificacionService.pendientes();
    }

    @PostMapping("/verificaciones/{id}/aprobar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void aprobarVerificacion(@PathVariable("id") Long id) {
        sesionActual.requerirAdministrador();
        verificacionService.resolver(id, true);
    }

    @PostMapping("/verificaciones/{id}/rechazar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void rechazarVerificacion(@PathVariable("id") Long id) {
        sesionActual.requerirAdministrador();
        verificacionService.resolver(id, false);
    }
}
