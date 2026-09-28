package com.estudiocucuta.modelo;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** Un reporte queda pendiente hasta que un administrador lo revisa. */
public enum EstadoReporte implements EnumConValor {
    PENDIENTE("pendiente"),
    RESUELTO("resuelto");

    private final String valor;

    EstadoReporte(String valor) {
        this.valor = valor;
    }

    @JsonValue
    @Override
    public String getValor() {
        return valor;
    }

    @JsonCreator
    public static EstadoReporte desdeValor(String valor) {
        return EnumConValor.desdeValor(EstadoReporte.class, valor);
    }
}
