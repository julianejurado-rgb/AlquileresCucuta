package com.estudiocucuta.modelo;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** Tipo de inmueble. La etiqueta se usa en la búsqueda por palabra clave. */
public enum TipoInmueble implements EnumConValor {
    APARTAESTUDIO("apartaestudio", "Apartaestudio"),
    HABITACION("habitacion", "Habitación"),
    APARTAMENTO("apartamento", "Apartamento pequeño");

    private final String valor;
    private final String etiqueta;

    TipoInmueble(String valor, String etiqueta) {
        this.valor = valor;
        this.etiqueta = etiqueta;
    }

    @JsonValue
    @Override
    public String getValor() {
        return valor;
    }

    public String getEtiqueta() {
        return etiqueta;
    }

    @JsonCreator
    public static TipoInmueble desdeValor(String valor) {
        return EnumConValor.desdeValor(TipoInmueble.class, valor);
    }
}
