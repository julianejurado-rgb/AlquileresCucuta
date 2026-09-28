package com.estudiocucuta.modelo;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** Motivo por el que un usuario reporta un anuncio. */
public enum MotivoReporte implements EnumConValor {
    FRAUDULENTO("fraudulento"),
    INFORMACION_FALSA("informacion-falsa"),
    CONTENIDO_INAPROPIADO("contenido-inapropiado"),
    PRECIO_ENGANOSO("precio-enganoso"),
    OTRO("otro");

    private final String valor;

    MotivoReporte(String valor) {
        this.valor = valor;
    }

    @JsonValue
    @Override
    public String getValor() {
        return valor;
    }

    @JsonCreator
    public static MotivoReporte desdeValor(String valor) {
        return EnumConValor.desdeValor(MotivoReporte.class, valor);
    }
}
