package com.estudiocucuta.servicio;

import com.estudiocucuta.excepcion.ApiException;
import com.estudiocucuta.modelo.Anuncio;
import com.estudiocucuta.modelo.Favorito;
import com.estudiocucuta.repositorio.AnuncioRepository;
import com.estudiocucuta.repositorio.FavoritoRepository;
import com.estudiocucuta.repositorio.UsuarioRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Favoritos por usuario (antes una sola lista por navegador en localStorage). */
@Service
@Transactional
public class FavoritoService {

    private final FavoritoRepository favoritoRepository;
    private final AnuncioRepository anuncioRepository;
    private final UsuarioRepository usuarioRepository;

    public FavoritoService(FavoritoRepository favoritoRepository,
                           AnuncioRepository anuncioRepository,
                           UsuarioRepository usuarioRepository) {
        this.favoritoRepository = favoritoRepository;
        this.anuncioRepository = anuncioRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public List<Long> idsDeFavoritos(Long usuarioId) {
        return favoritoRepository.idsDeAnunciosFavoritos(usuarioId);
    }

    public void agregar(Long usuarioId, Long anuncioId) {
        if (favoritoRepository.existsByUsuarioIdAndAnuncioId(usuarioId, anuncioId)) {
            return;
        }
        Anuncio anuncio = anuncioRepository.findById(anuncioId)
                .orElseThrow(() -> ApiException.noEncontrado("Este anuncio ya no está disponible."));
        favoritoRepository.save(new Favorito(usuarioRepository.getReferenceById(usuarioId), anuncio));
    }

    public void quitar(Long usuarioId, Long anuncioId) {
        favoritoRepository.findByUsuarioIdAndAnuncioId(usuarioId, anuncioId)
                .ifPresent(favoritoRepository::delete);
    }
}
