package com.estudiocucuta.dto;

import java.util.List;

/**
 * total: cuántos anuncios públicos hay en el sitio (sin filtros), para
 * distinguir "no hay anuncios" de "ninguno coincide con los filtros".
 */
public record ResultadoBusquedaDto(long total, List<AnuncioDto> anuncios) {
}
