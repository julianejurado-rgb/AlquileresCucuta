package com.estudiocucuta.modelo;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** Estado de una solicitud de verificación de cuenta. */
public enum EstadoVerificacion implements EnumConValor {
    PENDIENTE("pendiente"),
    APROBADA("aprobada"),
    RECHAZADA("rechazada");

    private final String valor;

    EstadoVerificacion(String valor) {
        this.valor = valor;
    }

    @JsonValue
    @Override
    public String getValor() {
        return valor;
    }

    @JsonCreator
    public static EstadoVerificacion desdeValor(String valor) {
        return EnumConValor.desdeValor(EstadoVerificacion.class, valor);
    }
}
