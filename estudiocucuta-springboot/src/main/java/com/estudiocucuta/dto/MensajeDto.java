package com.estudiocucuta.dto;

import com.estudiocucuta.modelo.Mensaje;
import java.time.LocalDateTime;

/** remitenteId viene vacío si quien lo envió eliminó su cuenta. */
public record MensajeDto(Long id, Long remitenteId, String texto, LocalDateTime fecha, boolean leido) {

    public static MensajeDto de(Mensaje mensaje) {
        Long remitenteId = mensaje.getRemitente() == null ? null : mensaje.getRemitente().getId();
        return new MensajeDto(mensaje.getId(), remitenteId, mensaje.getTexto(), mensaje.getFecha(), mensaje.isLeido());
    }
}
