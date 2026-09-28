package com.estudiocucuta.controlador;

import com.estudiocucuta.seguridad.SesionActual;
import com.estudiocucuta.servicio.FavoritoService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Favoritos del usuario con sesión iniciada. */
@RestController
@RequestMapping("/api/favoritos")
public class FavoritoController {

    private final FavoritoService favoritoService;
    private final SesionActual sesionActual;

    public FavoritoController(FavoritoService favoritoService, SesionActual sesionActual) {
        this.favoritoService = favoritoService;
        this.sesionActual = sesionActual;
    }

    /** Ids de los anuncios guardados. */
    @GetMapping
    public List<Long> listar() {
        return favoritoService.idsDeFavoritos(sesionActual.requerirUsuario().getId());
    }

    @PutMapping("/{anuncioId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void agregar(@PathVariable("anuncioId") Long anuncioId) {
        favoritoService.agregar(sesionActual.requerirUsuario().getId(), anuncioId);
    }

    @DeleteMapping("/{anuncioId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void quitar(@PathVariable("anuncioId") Long anuncioId) {
        favoritoService.quitar(sesionActual.requerirUsuario().getId(), anuncioId);
    }
}
