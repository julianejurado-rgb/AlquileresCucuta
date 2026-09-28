package com.estudiocucuta.repositorio;

import com.estudiocucuta.modelo.Anuncio;
import com.estudiocucuta.modelo.Favorito;
import com.estudiocucuta.modelo.Usuario;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FavoritoRepository extends JpaRepository<Favorito, Long> {

    /** Ids de los anuncios que guardó el usuario, sin los de propietarios bloqueados. */
    @Query("select f.anuncio.id from Favorito f "
            + "where f.usuario.id = :usuarioId and f.anuncio.propietario.bloqueado = false "
            + "order by f.fecha desc")
    List<Long> idsDeAnunciosFavoritos(@Param("usuarioId") Long usuarioId);

    boolean existsByUsuarioIdAndAnuncioId(Long usuarioId, Long anuncioId);

    Optional<Favorito> findByUsuarioIdAndAnuncioId(Long usuarioId, Long anuncioId);

    void deleteByAnuncio(Anuncio anuncio);

    void deleteByUsuario(Usuario usuario);
}
