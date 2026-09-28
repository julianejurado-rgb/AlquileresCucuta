package com.estudiocucuta.repositorio;

import com.estudiocucuta.modelo.Anuncio;
import com.estudiocucuta.modelo.Conversacion;
import com.estudiocucuta.modelo.Usuario;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversacionRepository extends JpaRepository<Conversacion, Long> {

    Optional<Conversacion> findByUsuario1AndUsuario2(Usuario usuario1, Usuario usuario2);

    List<Conversacion> findByUsuario1OrUsuario2(Usuario usuario1, Usuario usuario2);

    List<Conversacion> findByAnuncioOrigen(Anuncio anuncio);

    /** Contactos que recibió un anuncio (conversaciones que empezaron desde él). */
    long countByAnuncioOrigen(Anuncio anuncio);

    /** La pareja se guarda con el id menor primero (ver Conversacion). */
    default Optional<Conversacion> buscarEntre(Usuario a, Usuario b) {
        return a.getId() < b.getId() ? findByUsuario1AndUsuario2(a, b) : findByUsuario1AndUsuario2(b, a);
    }
}
