package com.estudiocucuta.dto;

import java.time.LocalDateTime;

/**
 * Conversación vista por uno de sus participantes.
 * otroUsuario viene vacío si la otra persona eliminó su cuenta, y anuncio
 * si el anuncio desde el que empezó el chat ya no existe.
 */
public record ConversacionDto(
        Long id,
        UsuarioPublicoDto otroUsuario,
        AnuncioBreveDto anuncio,
        MensajeDto ultimoMensaje,
        boolean tieneNoLeidos,
        LocalDateTime ultimaActividad) {
}
