package com.estudiocucuta.dto;

import com.estudiocucuta.modelo.EstadoVerificacion;
import com.estudiocucuta.modelo.SolicitudVerificacion;
import java.time.LocalDateTime;

public record SolicitudVerificacionDto(Long id, UsuarioPublicoDto usuario, LocalDateTime fecha, EstadoVerificacion estado) {

    public static SolicitudVerificacionDto de(SolicitudVerificacion solicitud) {
        return new SolicitudVerificacionDto(
                solicitud.getId(),
                UsuarioPublicoDto.conCorreo(solicitud.getUsuario()),
                solicitud.getFecha(),
                solicitud.getEstado());
    }
}
