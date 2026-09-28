package com.estudiocucuta.servicio;

import com.estudiocucuta.dto.SolicitudVerificacionDto;
import com.estudiocucuta.excepcion.ApiException;
import com.estudiocucuta.modelo.EstadoVerificacion;
import com.estudiocucuta.modelo.SolicitudVerificacion;
import com.estudiocucuta.modelo.Usuario;
import com.estudiocucuta.repositorio.SolicitudVerificacionRepository;
import com.estudiocucuta.repositorio.UsuarioRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Un usuario pide que verifiquen su cuenta; si un administrador lo aprueba,
 * su nombre aparece con el chulito de verificado en los anuncios.
 */
@Service
@Transactional
public class VerificacionService {

    private final SolicitudVerificacionRepository solicitudRepository;
    private final UsuarioRepository usuarioRepository;

    public VerificacionService(SolicitudVerificacionRepository solicitudRepository,
                               UsuarioRepository usuarioRepository) {
        this.solicitudRepository = solicitudRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public void solicitar(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> ApiException.noEncontrado("Usuario no encontrado."));
        if (usuario.esAdministrador()) {
            throw ApiException.invalido("Las cuentas de administrador no necesitan verificación.");
        }
        if (usuario.isVerificado()) {
            throw ApiException.conflicto("Tu cuenta ya está verificada.");
        }
        if (solicitudRepository.existsByUsuarioAndEstado(usuario, EstadoVerificacion.PENDIENTE)) {
            throw ApiException.conflicto("Ya tienes una solicitud de verificación pendiente.");
        }
        solicitudRepository.save(new SolicitudVerificacion(usuario));
    }

    @Transactional(readOnly = true)
    public List<SolicitudVerificacionDto> pendientes() {
        return solicitudRepository.findByEstadoOrderByFechaAscIdAsc(EstadoVerificacion.PENDIENTE).stream()
                .map(SolicitudVerificacionDto::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public long contarPendientes() {
        return solicitudRepository.countByEstado(EstadoVerificacion.PENDIENTE);
    }

    public void resolver(Long solicitudId, boolean aprobar) {
        SolicitudVerificacion solicitud = solicitudRepository.findById(solicitudId)
                .orElseThrow(() -> ApiException.noEncontrado("Esta solicitud no existe."));
        if (solicitud.getEstado() != EstadoVerificacion.PENDIENTE) {
            throw ApiException.conflicto("Esta solicitud ya fue revisada.");
        }
        solicitud.setEstado(aprobar ? EstadoVerificacion.APROBADA : EstadoVerificacion.RECHAZADA);
        if (aprobar) {
            solicitud.getUsuario().setVerificado(true);
        }
    }
}
