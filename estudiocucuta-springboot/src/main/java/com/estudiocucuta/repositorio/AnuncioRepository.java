package com.estudiocucuta.repositorio;

import com.estudiocucuta.modelo.Anuncio;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

/** Las búsquedas con filtros usan JpaSpecificationExecutor (ver AnuncioSpecs). */
public interface AnuncioRepository extends JpaRepository<Anuncio, Long>, JpaSpecificationExecutor<Anuncio> {

    List<Anuncio> findByPropietarioIdOrderByFechaPublicacionDescIdDesc(Long propietarioId);

    List<Anuncio> findAllByOrderByFechaPublicacionDescIdDesc();
}
