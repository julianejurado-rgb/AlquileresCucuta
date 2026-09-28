package com.estudiocucuta.repositorio;

import com.estudiocucuta.modelo.Conversacion;
import com.estudiocucuta.modelo.Mensaje;
import com.estudiocucuta.modelo.Usuario;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * En las consultas de "no leídos", un mensaje sin remitente (de alguien que
 * eliminó su cuenta) cuenta como recibido.
 */
public interface MensajeRepository extends JpaRepository<Mensaje, Long> {

    List<Mensaje> findByConversacionOrderByFechaAscIdAsc(Conversacion conversacion);

    Optional<Mensaje> findFirstByConversacionOrderByFechaDescIdDesc(Conversacion conversacion);

    List<Mensaje> findByRemitente(Usuario remitente);

    @Query("select count(m) from Mensaje m "
            + "where m.conversacion = :conversacion and m.leido = false "
            + "and (m.remitente is null or m.remitente <> :usuario)")
    long contarNoLeidos(@Param("conversacion") Conversacion conversacion, @Param("usuario") Usuario usuario);

    @Query("select count(distinct m.conversacion.id) from Mensaje m "
            + "where (m.conversacion.usuario1 = :usuario or m.conversacion.usuario2 = :usuario) "
            + "and m.leido = false and (m.remitente is null or m.remitente <> :usuario)")
    long contarConversacionesConNoLeidos(@Param("usuario") Usuario usuario);

    @Modifying
    @Query("update Mensaje m set m.leido = true "
            + "where m.conversacion = :conversacion and m.leido = false "
            + "and (m.remitente is null or m.remitente <> :usuario)")
    int marcarLeidos(@Param("conversacion") Conversacion conversacion, @Param("usuario") Usuario usuario);
}
