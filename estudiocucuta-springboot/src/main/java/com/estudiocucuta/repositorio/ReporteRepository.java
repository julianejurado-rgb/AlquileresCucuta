package com.estudiocucuta.repositorio;

import com.estudiocucuta.modelo.Anuncio;
import com.estudiocucuta.modelo.EstadoReporte;
import com.estudiocucuta.modelo.Reporte;
import com.estudiocucuta.modelo.Usuario;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReporteRepository extends JpaRepository<Reporte, Long> {

    boolean existsByAnuncioAndReportadoPorAndEstado(Anuncio anuncio, Usuario reportadoPor, EstadoReporte estado);

    List<Reporte> findByEstadoOrderByFechaAscIdAsc(EstadoReporte estado);

    long countByEstado(EstadoReporte estado);

    void deleteByAnuncio(Anuncio anuncio);

    void deleteByReportadoPor(Usuario reportadoPor);
}
