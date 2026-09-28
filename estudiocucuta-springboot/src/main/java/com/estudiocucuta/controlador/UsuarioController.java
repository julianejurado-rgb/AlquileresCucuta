package com.estudiocucuta.controlador;

import com.estudiocucuta.dto.AnuncioDto;
import com.estudiocucuta.dto.UsuarioPublicoDto;
import com.estudiocucuta.seguridad.SesionActual;
import com.estudiocucuta.servicio.UsuarioService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Perfil público de un usuario (propietario.html). */
@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final SesionActual sesionActual;

    public UsuarioController(UsuarioService usuarioService, SesionActual sesionActual) {
        this.usuarioService = usuarioService;
        this.sesionActual = sesionActual;
    }

    @GetMapping("/{id}")
    public UsuarioPublicoDto perfil(@PathVariable("id") Long id) {
        return usuarioService.perfilPublico(id, sesionActual.usuario().orElse(null));
    }

    @GetMapping("/{id}/anuncios")
    public List<AnuncioDto> anuncios(@PathVariable("id") Long id) {
        return usuarioService.anunciosDe(id, sesionActual.usuario().orElse(null));
    }
}
