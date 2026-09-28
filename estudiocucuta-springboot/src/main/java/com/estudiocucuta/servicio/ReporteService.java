package com.estudiocucuta.servicio;

import com.estudiocucuta.dto.ReporteDto;
import com.estudiocucuta.dto.ReporteRequest;
import com.estudiocucuta.excepcion.ApiException;
import com.estudiocucuta.modelo.Anuncio;
import com.estudiocucuta.modelo.EstadoReporte;
import com.estudiocucuta.modelo.Reporte;
import com.estudiocucuta.modelo.Usuario;
import com.estudiocucuta.repositorio.AnuncioRepository;
import com.estudiocucuta.repositorio.ReporteRepository;
import com.estudiocucuta.repositorio.UsuarioRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Un reporte queda pendiente hasta que un administrador lo marca como resuelto. */
@Service
@Transactional
public class ReporteService {

    private final ReporteRepository reporteRepository;
    private final AnuncioRepository anuncioRepository;
    private final UsuarioRepository usuarioRepository;

    public ReporteService(ReporteRepository reporteRepository,
                          AnuncioRepository anuncioRepository,
                          UsuarioRepository usuarioRepository) {
        this.reporteRepository = reporteRepository;
        this.anuncioRepository = anuncioRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public ReporteDto reportar(Long anuncioId, ReporteRequest datos, Usuario actual) {
        Anuncio anuncio = anuncioRepository.findById(anuncioId)
                .orElseThrow(() -> ApiException.noEncontrado("Este anuncio ya no está disponible."));
        if (anuncio.getPropietario().getId().equals(actual.getId())) {
            throw ApiException.invalido("No puedes reportar tu propio anuncio.");
        }

        Usuario usuario = usuarioRepository.getReferenceById(actual.getId());
        if (reporteRepository.existsByAnuncioAndReportadoPorAndEstado(anuncio, usuario, EstadoReporte.PENDIENTE)) {
            throw ApiException.conflicto("Ya reportaste este anuncio. Está pendiente de revisión.");
        }

        String descripcion = datos.descripcion() == null || datos.descripcion().isBlank()
                ? null : datos.descripcion().trim();
        Reporte reporte = reporteRepository.save(new Reporte(anuncio, usuario, datos.motivo(), descripcion));
        return ReporteDto.de(reporte);
    }

    @Transactional(readOnly = true)
    public List<ReporteDto> pendientes() {
        return reporteRepository.findByEstadoOrderByFechaAscIdAsc(EstadoReporte.PENDIENTE).stream()
                .map(ReporteDto::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public long contarPendientes() {
        return reporteRepository.countByEstado(EstadoReporte.PENDIENTE);
    }

    public void marcarResuelto(Long reporteId) {
        Reporte reporte = reporteRepository.findById(reporteId)
                .orElseThrow(() -> ApiException.noEncontrado("Este reporte no existe."));
        reporte.setEstado(EstadoReporte.RESUELTO);
    }
}
