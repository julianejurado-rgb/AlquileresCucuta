package com.estudiocucuta.dto;

/** Reglas compartidas por varios formularios. */
public final class Validaciones {

    /** La misma expresión que usaban registro.js y perfil.js. */
    public static final String CORREO = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";

    private Validaciones() {
    }
}
