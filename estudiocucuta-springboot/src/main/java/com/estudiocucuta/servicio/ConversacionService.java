package com.estudiocucuta.servicio;

import com.estudiocucuta.dto.AnuncioBreveDto;
import com.estudiocucuta.dto.ConversacionDto;
import com.estudiocucuta.dto.MensajeDto;
import com.estudiocucuta.dto.UsuarioPublicoDto;
import com.estudiocucuta.excepcion.ApiException;
import com.estudiocucuta.modelo.Anuncio;
import com.estudiocucuta.modelo.Conversacion;
import com.estudiocucuta.modelo.Mensaje;
import com.estudiocucuta.modelo.Usuario;
import com.estudiocucuta.repositorio.AnuncioRepository;
import com.estudiocucuta.repositorio.ConversacionRepository;
import com.estudiocucuta.repositorio.MensajeRepository;
import com.estudiocucuta.repositorio.UsuarioRepository;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Chat entre usuarios (antes simulado en localStorage, solo funcionaba en un mismo navegador). */
@Service
@Transactional
public class ConversacionService {

    private static final String NO_EXISTE = "Esta conversación no existe.";

    private final ConversacionRepository conversacionRepository;
    private final MensajeRepository mensajeRepository;
    private final AnuncioRepository anuncioRepository;
    private final UsuarioRepository usuarioRepository;

    public ConversacionService(ConversacionRepository conversacionRepository,
                               MensajeRepository mensajeRepository,
                               AnuncioRepository anuncioRepository,
                               UsuarioRepository usuarioRepository) {
        this.conversacionRepository = conversacionRepository;
        this.mensajeRepository = mensajeRepository;
        this.anuncioRepository = anuncioRepository;
        this.usuarioRepository = usuarioRepository;
    }

    /**
     * "Contactar por chat" desde un anuncio. Si esas dos personas ya tienen
     * una conversación (aunque haya empezado en otro anuncio), se reabre esa.
     */
    public ConversacionDto obtenerOCrear(Long anuncioId, Usuario actual) {
        Anuncio anuncio = anuncioRepository.findById(anuncioId)
                .orElseThrow(() -> ApiException.noEncontrado("Este anuncio ya no está disponible."));
        Usuario propietario = anuncio.getPropietario();
        if (propietario.getId().equals(actual.getId())) {
            throw ApiException.invalido("No puedes contactarte a ti mismo.");
        }
        if (propietario.isBloqueado()) {
            throw ApiException.noEncontrado("Este anuncio ya no está disponible.");
        }

        Usuario interesado = usuarioRepository.getReferenceById(actual.getId());
        Conversacion conversacion = conversacionRepository.buscarEntre(propietario, interesado)
                .orElseGet(() -> conversacionRepository.save(new Conversacion(propietario, interesado, anuncio)));
        return aDto(conversacion, actual.getId());
    }

    /** Conversaciones del usuario, la de actividad más reciente primero. */
    @Transactional(readOnly = true)
    public List<ConversacionDto> listar(Usuario actual) {
        return conversacionRepository.findByUsuario1OrUsuario2(actual, actual).stream()
                .map(conversacion -> aDto(conversacion, actual.getId()))
                .sorted(Comparator.comparing(ConversacionDto::ultimaActividad).reversed())
                .toList();
    }

    @Transactional(readOnly = true)
    public ConversacionDto obtener(Long conversacionId, Usuario actual) {
        return aDto(buscarPropia(conversacionId, actual), actual.getId());
    }

    @Transactional(readOnly = true)
    public List<MensajeDto> mensajes(Long conversacionId, Usuario actual) {
        Conversacion conversacion = buscarPropia(conversacionId, actual);
        return mensajeRepository.findByConversacionOrderByFechaAscIdAsc(conversacion).stream()
                .map(MensajeDto::de)
                .toList();
    }

    public MensajeDto enviar(Long conversacionId, String texto, Usuario actual) {
        Conversacion conversacion = buscarPropia(conversacionId, actual);
        if (conversacion.otroParticipante(actual.getId()) == null) {
            throw ApiException.invalido("Esta persona eliminó su cuenta y ya no puede recibir mensajes.");
        }
        Mensaje mensaje = new Mensaje(conversacion, usuarioRepository.getReferenceById(actual.getId()), texto.trim());
        return MensajeDto.de(mensajeRepository.save(mensaje));
    }

    /** Marca como leídos los mensajes que recibió el usuario en esa conversación. */
    public void marcarLeida(Long conversacionId, Usuario actual) {
        Conversacion conversacion = buscarPropia(conversacionId, actual);
        mensajeRepository.marcarLeidos(conversacion, actual);
    }

    /** Para el contador rojo de la burbuja del chat. */
    @Transactional(readOnly = true)
    public long contarConNoLeidos(Usuario actual) {
        return mensajeRepository.contarConversacionesConNoLeidos(actual);
    }

    /** Solo sus dos participantes pueden ver una conversación. */
    private Conversacion buscarPropia(Long conversacionId, Usuario actual) {
        Conversacion conversacion = conversacionRepository.findById(conversacionId)
                .orElseThrow(() -> ApiException.noEncontrado(NO_EXISTE));
        if (!conversacion.participa(actual.getId())) {
            throw ApiException.noEncontrado(NO_EXISTE);
        }
        return conversacion;
    }

    private ConversacionDto aDto(Conversacion conversacion, Long usuarioId) {
        Optional<Mensaje> ultimo = mensajeRepository.findFirstByConversacionOrderByFechaDescIdDesc(conversacion);
        boolean tieneNoLeidos = mensajeRepository.contarNoLeidos(conversacion, usuarioRepository.getReferenceById(usuarioId)) > 0;
        LocalDateTime ultimaActividad = ultimo.map(Mensaje::getFecha).orElse(conversacion.getFechaCreacion());

        return new ConversacionDto(
                conversacion.getId(),
                UsuarioPublicoDto.de(conversacion.otroParticipante(usuarioId)),
                AnuncioBreveDto.de(conversacion.getAnuncioOrigen()),
                ultimo.map(MensajeDto::de).orElse(null),
                tieneNoLeidos,
                ultimaActividad);
    }
}
