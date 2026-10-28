package com.estudiocucuta.dto;

/** Reglas compartidas por varios formularios. */
public final class Validaciones {

    /** La misma expresión que usan registro.js y perfil.js, para que el navegador y el servidor acepten los mismos correos. */
    public static final String CORREO = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";

    private Validaciones() {
    }
}
