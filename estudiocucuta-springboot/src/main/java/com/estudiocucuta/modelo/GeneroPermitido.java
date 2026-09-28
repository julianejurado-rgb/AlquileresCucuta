package com.estudiocucuta.modelo;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** A quién se le arrienda el inmueble. */
public enum GeneroPermitido implements EnumConValor {
    TODOS("todos"),
    HOMBRES("hombres"),
    MUJERES("mujeres");

    private final String valor;

    GeneroPermitido(String valor) {
        this.valor = valor;
    }

    @JsonValue
    @Override
    public String getValor() {
        return valor;
    }

    @JsonCreator
    public static GeneroPermitido desdeValor(String valor) {
        return EnumConValor.desdeValor(GeneroPermitido.class, valor);
    }
}
