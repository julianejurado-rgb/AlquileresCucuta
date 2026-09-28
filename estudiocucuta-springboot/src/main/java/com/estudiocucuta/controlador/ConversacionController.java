package com.estudiocucuta.controlador;

import com.estudiocucuta.dto.ContadorDto;
import com.estudiocucuta.dto.ConversacionDto;
import com.estudiocucuta.dto.ConversacionRequest;
import com.estudiocucuta.dto.MensajeDto;
import com.estudiocucuta.dto.MensajeRequest;
import com.estudiocucuta.seguridad.SesionActual;
import com.estudiocucuta.servicio.ConversacionService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Chat del widget flotante (chat-widget.js). */
@RestController
@RequestMapping("/api/conversaciones")
public class ConversacionController {

    private final ConversacionService conversacionService;
    private final SesionActual sesionActual;

    public ConversacionController(ConversacionService conversacionService, SesionActual sesionActual) {
        this.conversacionService = conversacionService;
        this.sesionActual = sesionActual;
    }

    @GetMapping
    public List<ConversacionDto> listar() {
        return conversacionService.listar(sesionActual.requerirUsuario());
    }

    /** Botón "Contactar por chat" del detalle de un anuncio. */
    @PostMapping
    public ConversacionDto obtenerOCrear(@Valid @RequestBody ConversacionRequest datos) {
        return conversacionService.obtenerOCrear(datos.anuncioId(), sesionActual.requerirUsuario());
    }

    @GetMapping("/no-leidas")
    public ContadorDto noLeidas() {
        return new ContadorDto(conversacionService.contarConNoLeidos(sesionActual.requerirUsuario()));
    }

    @GetMapping("/{id}")
    public ConversacionDto obtener(@PathVariable("id") Long id) {
        return conversacionService.obtener(id, sesionActual.requerirUsuario());
    }

    @GetMapping("/{id}/mensajes")
    public List<MensajeDto> mensajes(@PathVariable("id") Long id) {
        return conversacionService.mensajes(id, sesionActual.requerirUsuario());
    }

    @PostMapping("/{id}/mensajes")
    @ResponseStatus(HttpStatus.CREATED)
    public MensajeDto enviar(@PathVariable("id") Long id, @Valid @RequestBody MensajeRequest datos) {
        return conversacionService.enviar(id, datos.texto(), sesionActual.requerirUsuario());
    }

    @PutMapping("/{id}/leida")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void marcarLeida(@PathVariable("id") Long id) {
        conversacionService.marcarLeida(id, sesionActual.requerirUsuario());
    }
}
