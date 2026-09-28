package com.estudiocucuta.dto;

import com.estudiocucuta.modelo.EstadoReporte;
import com.estudiocucuta.modelo.MotivoReporte;
import com.estudiocucuta.modelo.Reporte;
import java.time.LocalDateTime;

public record ReporteDto(
        Long id,
        AnuncioBreveDto anuncio,
        MotivoReporte motivo,
        String descripcion,
        UsuarioPublicoDto reportadoPor,
        LocalDateTime fecha,
        EstadoReporte estado) {

    public static ReporteDto de(Reporte reporte) {
        return new ReporteDto(
                reporte.getId(),
                AnuncioBreveDto.de(reporte.getAnuncio()),
                reporte.getMotivo(),
                reporte.getDescripcion(),
                UsuarioPublicoDto.de(reporte.getReportadoPor()),
                reporte.getFecha(),
                reporte.getEstado());
    }
}
