package com.estudiocucuta.modelo;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** Estado de disponibilidad del inmueble. */
public enum EstadoAnuncio implements EnumConValor {
    DISPONIBLE("disponible"),
    RESERVADO("reservado"),
    ALQUILADO("alquilado");

    private final String valor;

    EstadoAnuncio(String valor) {
        this.valor = valor;
    }

    @JsonValue
    @Override
    public String getValor() {
        return valor;
    }

    @JsonCreator
    public static EstadoAnuncio desdeValor(String valor) {
        return EnumConValor.desdeValor(EstadoAnuncio.class, valor);
    }
}
