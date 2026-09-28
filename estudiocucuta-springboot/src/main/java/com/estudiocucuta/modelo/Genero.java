package com.estudiocucuta.modelo;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** Género de la persona que se registra. */
public enum Genero implements EnumConValor {
    HOMBRE("hombre"),
    MUJER("mujer");

    private final String valor;

    Genero(String valor) {
        this.valor = valor;
    }

    @JsonValue
    @Override
    public String getValor() {
        return valor;
    }

    @JsonCreator
    public static Genero desdeValor(String valor) {
        return EnumConValor.desdeValor(Genero.class, valor);
    }
}
