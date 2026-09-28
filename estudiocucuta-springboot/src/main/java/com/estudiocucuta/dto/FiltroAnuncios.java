package com.estudiocucuta.dto;

import com.estudiocucuta.modelo.Ciudad;
import com.estudiocucuta.modelo.GeneroPermitido;
import com.estudiocucuta.modelo.TipoInmueble;
import java.math.BigDecimal;

/**
 * Criterios del buscador de index.html. Todos son opcionales.
 * orden: vacío (más recientes), "antiguos", "precio-asc" o "precio-desc".
 */
public record FiltroAnuncios(
        String q,
        Ciudad ciudad,
        BigDecimal precioMax,
        TipoInmueble tipo,
        GeneroPermitido genero,
        Boolean mascotas,
        Boolean amoblado,
        boolean soloFavoritos,
        String orden) {
}
