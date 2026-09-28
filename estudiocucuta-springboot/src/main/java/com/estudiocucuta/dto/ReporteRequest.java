package com.estudiocucuta.dto;

import com.estudiocucuta.modelo.MotivoReporte;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReporteRequest(
        @NotNull(message = "Selecciona un motivo.")
        MotivoReporte motivo,

        @Size(max = 500, message = "Los detalles no pueden tener más de 500 caracteres.")
        String descripcion) {
}
