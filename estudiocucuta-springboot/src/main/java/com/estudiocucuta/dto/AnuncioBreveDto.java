package com.estudiocucuta.dto;

import com.estudiocucuta.modelo.Anuncio;

/** Referencia corta a un anuncio (en chats y reportes). */
public record AnuncioBreveDto(Long id, String titulo) {

    public static AnuncioBreveDto de(Anuncio anuncio) {
        if (anuncio == null) {
            return null;
        }
        return new AnuncioBreveDto(anuncio.getId(), anuncio.getTitulo());
    }
}
