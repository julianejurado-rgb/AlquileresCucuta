package com.estudiocucuta.dto;

import com.estudiocucuta.modelo.Ciudad;
import com.estudiocucuta.modelo.EstadoAnuncio;
import com.estudiocucuta.modelo.GeneroPermitido;
import com.estudiocucuta.modelo.TipoInmueble;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

/**
 * Datos del formulario de publicar/editar. Llega como la parte "datos"
 * (JSON) de un multipart; las fotos nuevas llegan como archivos aparte.
 */
public record AnuncioRequest(
        @NotBlank(message = "Escribe un título de al menos 3 caracteres.")
        @Size(min = 3, max = 80, message = "El título debe tener entre 3 y 80 caracteres.")
        String titulo,

        @NotNull(message = "Selecciona el tipo de inmueble.")
        TipoInmueble tipo,

        @NotNull(message = "Escribe un precio válido.")
        @Positive(message = "Escribe un precio válido.")
        @Digits(integer = 12, fraction = 0, message = "Escribe un precio válido, sin decimales.")
        BigDecimal precio,

        @NotNull(message = "Selecciona la ciudad.")
        Ciudad ciudad,

        @NotBlank(message = "Escribe el barrio.")
        @Size(max = 60, message = "El barrio no puede tener más de 60 caracteres.")
        String barrio,

        EstadoAnuncio estado,

        @Size(max = 20, message = "El teléfono no puede tener más de 20 caracteres.")
        String telefono,

        @Positive(message = "El área debe ser mayor que cero.")
        Integer area,

        Boolean amoblado,

        Boolean mascotas,

        GeneroPermitido generoPermitido,

        @NotBlank(message = "Escribe una descripción de al menos 10 caracteres.")
        @Size(min = 10, max = 800, message = "La descripción debe tener entre 10 y 800 caracteres.")
        String descripcion,

        // URLs de las fotos que ya tenía el anuncio y se conservan, en orden
        List<String> fotosConservadas) {
}
