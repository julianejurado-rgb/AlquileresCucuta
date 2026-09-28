package com.estudiocucuta.repositorio;

import com.estudiocucuta.modelo.EstadoVerificacion;
import com.estudiocucuta.modelo.SolicitudVerificacion;
import com.estudiocucuta.modelo.Usuario;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SolicitudVerificacionRepository extends JpaRepository<SolicitudVerificacion, Long> {

    boolean existsByUsuarioAndEstado(Usuario usuario, EstadoVerificacion estado);

    List<SolicitudVerificacion> findByEstadoOrderByFechaAscIdAsc(EstadoVerificacion estado);

    long countByEstado(EstadoVerificacion estado);

    void deleteByUsuario(Usuario usuario);
}
