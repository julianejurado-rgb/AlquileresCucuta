package com.estudiocucuta.modelo;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** Ciudades del área metropolitana. La etiqueta se usa en la búsqueda por palabra clave. */
public enum Ciudad implements EnumConValor {
    CUCUTA("cucuta", "Cúcuta"),
    VILLA_DEL_ROSARIO("villa-del-rosario", "Villa del Rosario"),
    LOS_PATIOS("los-patios", "Los Patios");

    private final String valor;
    private final String etiqueta;

    Ciudad(String valor, String etiqueta) {
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
    public static Ciudad desdeValor(String valor) {
        return EnumConValor.desdeValor(Ciudad.class, valor);
    }
}
