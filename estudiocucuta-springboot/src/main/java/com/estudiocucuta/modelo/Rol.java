package com.estudiocucuta.modelo;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** Rol de la cuenta. Cualquier USUARIO puede publicar y contactar; el ADMINISTRADOR modera. */
public enum Rol implements EnumConValor {
    USUARIO("usuario"),
    ADMINISTRADOR("administrador");

    private final String valor;

    Rol(String valor) {
        this.valor = valor;
    }

    @JsonValue
    @Override
    public String getValor() {
        return valor;
    }

    @JsonCreator
    public static Rol desdeValor(String valor) {
        return EnumConValor.desdeValor(Rol.class, valor);
    }
}
