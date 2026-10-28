package com.estudiocucuta.repositorio;

import com.estudiocucuta.modelo.Anuncio;
import com.estudiocucuta.modelo.Conversacion;
import com.estudiocucuta.modelo.Usuario;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ConversacionRepository extends JpaRepository<Conversacion, Long> {

    Optional<Conversacion> findByPropietarioAndInteresado(Usuario propietario, Usuario interesado);

    /** Todas las conversaciones del usuario, sea como propietario o como interesado. */
    @Query("select c from Conversacion c where c.propietario = :usuario or c.interesado = :usuario")
    List<Conversacion> buscarDeUsuario(@Param("usuario") Usuario usuario);

    List<Conversacion> findByAnuncioOrigen(Anuncio anuncio);

    /** Contactos que recibió un anuncio (conversaciones que empezaron desde él). */
    long countByAnuncioOrigen(Anuncio anuncio);
}
