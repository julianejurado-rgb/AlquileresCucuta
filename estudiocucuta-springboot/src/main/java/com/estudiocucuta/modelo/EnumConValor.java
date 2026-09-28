package com.estudiocucuta.modelo;

/**
 * Enum que se guarda en la base de datos con su nombre (VILLA_DEL_ROSARIO)
 * pero viaja en el JSON con el valor que ya usaba el frontend
 * ("villa-del-rosario"), porque un enum de Java no admite guiones.
 */
public interface EnumConValor {

    String getValor();

    /** Busca la constante por su valor. Devuelve null si el valor viene vacío. */
    static <E extends Enum<E> & EnumConValor> E desdeValor(Class<E> tipo, String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        for (E constante : tipo.getEnumConstants()) {
            if (constante.getValor().equals(valor)) {
                return constante;
            }
        }
        throw new IllegalArgumentException("Valor no válido para " + tipo.getSimpleName() + ": " + valor);
    }
}
