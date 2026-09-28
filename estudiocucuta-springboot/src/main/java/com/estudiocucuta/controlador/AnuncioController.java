package com.estudiocucuta.controlador;

import com.estudiocucuta.dto.AnuncioDto;
import com.estudiocucuta.dto.AnuncioRequest;
import com.estudiocucuta.dto.FiltroAnuncios;
import com.estudiocucuta.dto.ReporteDto;
import com.estudiocucuta.dto.ReporteRequest;
import com.estudiocucuta.dto.ResultadoBusquedaDto;
import com.estudiocucuta.modelo.Ciudad;
import com.estudiocucuta.modelo.GeneroPermitido;
import com.estudiocucuta.modelo.TipoInmueble;
import com.estudiocucuta.seguridad.SesionActual;
import com.estudiocucuta.servicio.AnuncioService;
import com.estudiocucuta.servicio.ReporteService;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/anuncios")
public class AnuncioController {

    private final AnuncioService anuncioService;
    private final ReporteService reporteService;
    private final SesionActual sesionActual;

    public AnuncioController(AnuncioService anuncioService, ReporteService reporteService, SesionActual sesionActual) {
        this.anuncioService = anuncioService;
        this.reporteService = reporteService;
        this.sesionActual = sesionActual;
    }

    /** Listado con filtros, por ejemplo /api/anuncios?ciudad=cucuta&precioMax=800000&orden=precio-asc */
    @GetMapping
    public ResultadoBusquedaDto buscar(
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "ciudad", required = false) String ciudad,
            @RequestParam(name = "precioMax", required = false) BigDecimal precioMax,
            @RequestParam(name = "tipo", required = false) String tipo,
            @RequestParam(name = "genero", required = false) String genero,
            @RequestParam(name = "mascotas", required = false) Boolean mascotas,
            @RequestParam(name = "amoblado", required = false) Boolean amoblado,
            @RequestParam(name = "soloFavoritos", defaultValue = "false") boolean soloFavoritos,
            @RequestParam(name = "orden", required = false) String orden) {
        FiltroAnuncios filtro = new FiltroAnuncios(
                q,
                Ciudad.desdeValor(ciudad),
                precioMax,
                TipoInmueble.desdeValor(tipo),
                GeneroPermitido.desdeValor(genero),
                mascotas,
                amoblado,
                soloFavoritos,
                orden);
        return anuncioService.buscar(filtro, sesionActual.usuario().orElse(null));
    }

    @GetMapping("/{id}")
    public AnuncioDto detalle(@PathVariable("id") Long id) {
        return anuncioService.detalle(id, sesionActual.usuario().orElse(null));
    }

    /** Multipart: la parte "datos" es el JSON del formulario y "fotos" son los archivos. */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public AnuncioDto crear(@Valid @RequestPart("datos") AnuncioRequest datos,
                            @RequestPart(name = "fotos", required = false) List<MultipartFile> fotos) {
        return anuncioService.crear(datos, fotos, sesionActual.requerirUsuario().getId());
    }

    @PutMapping(path = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AnuncioDto actualizar(@PathVariable("id") Long id,
                                 @Valid @RequestPart("datos") AnuncioRequest datos,
                                 @RequestPart(name = "fotos", required = false) List<MultipartFile> fotos) {
        return anuncioService.actualizar(id, datos, fotos, sesionActual.requerirUsuario().getId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable("id") Long id) {
        anuncioService.eliminar(id, sesionActual.requerirUsuario());
    }

    @PostMapping("/{id}/visitas")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void registrarVisita(@PathVariable("id") Long id) {
        anuncioService.registrarVisita(id, sesionActual.usuario().orElse(null));
    }

    @PostMapping("/{id}/reportes")
    @ResponseStatus(HttpStatus.CREATED)
    public ReporteDto reportar(@PathVariable("id") Long id, @Valid @RequestBody ReporteRequest datos) {
        return reporteService.reportar(id, datos, sesionActual.requerirUsuario());
    }
}
