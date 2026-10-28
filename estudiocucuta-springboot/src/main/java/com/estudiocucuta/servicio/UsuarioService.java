package com.estudiocucuta.servicio;

import com.estudiocucuta.dto.AnuncioDto;
import com.estudiocucuta.dto.CambioContrasenaRequest;
import com.estudiocucuta.dto.CuentaDto;
import com.estudiocucuta.dto.DatosCuentaRequest;
import com.estudiocucuta.dto.RegistroRequest;
import com.estudiocucuta.dto.UsuarioAdminDto;
import com.estudiocucuta.dto.UsuarioPublicoDto;
import com.estudiocucuta.excepcion.ApiException;
import com.estudiocucuta.modelo.Conversacion;
import com.estudiocucuta.modelo.EstadoVerificacion;
import com.estudiocucuta.modelo.Rol;
import com.estudiocucuta.modelo.Usuario;
import com.estudiocucuta.repositorio.AnuncioRepository;
import com.estudiocucuta.repositorio.ConversacionRepository;
import com.estudiocucuta.repositorio.FavoritoRepository;
import com.estudiocucuta.repositorio.MensajeRepository;
import com.estudiocucuta.repositorio.ReporteRepository;
import com.estudiocucuta.repositorio.SolicitudVerificacionRepository;
import com.estudiocucuta.repositorio.UsuarioRepository;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final AnuncioRepository anuncioRepository;
    private final FavoritoRepository favoritoRepository;
    private final ReporteRepository reporteRepository;
    private final SolicitudVerificacionRepository solicitudRepository;
    private final ConversacionRepository conversacionRepository;
    private final MensajeRepository mensajeRepository;
    private final AnuncioService anuncioService;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository,
                          AnuncioRepository anuncioRepository,
                          FavoritoRepository favoritoRepository,
                          ReporteRepository reporteRepository,
                          SolicitudVerificacionRepository solicitudRepository,
                          ConversacionRepository conversacionRepository,
                          MensajeRepository mensajeRepository,
                          AnuncioService anuncioService,
                          PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.anuncioRepository = anuncioRepository;
        this.favoritoRepository = favoritoRepository;
        this.reporteRepository = reporteRepository;
        this.solicitudRepository = solicitudRepository;
        this.conversacionRepository = conversacionRepository;
        this.mensajeRepository = mensajeRepository;
        this.anuncioService = anuncioService;
        this.passwordEncoder = passwordEncoder;
    }

    public Usuario registrar(RegistroRequest datos) {
        String correo = normalizarCorreo(datos.correo());
        if (usuarioRepository.existsByCorreoIgnoreCase(correo)) {
            throw ApiException.conflicto("Ya existe una cuenta registrada con ese correo.");
        }
        Usuario usuario = new Usuario(datos.nombre().trim(), correo,
                passwordEncoder.encode(datos.contrasena()), datos.genero(), Rol.USUARIO);
        return usuarioRepository.save(usuario);
    }

    @Transactional(readOnly = true)
    public CuentaDto cuenta(Long usuarioId) {
        Usuario usuario = buscar(usuarioId);
        boolean pendiente = solicitudRepository.existsByUsuarioAndEstado(usuario, EstadoVerificacion.PENDIENTE);
        return CuentaDto.de(usuario, pendiente);
    }

    public CuentaDto actualizarDatos(Long usuarioId, DatosCuentaRequest datos) {
        Usuario usuario = buscar(usuarioId);
        String correo = normalizarCorreo(datos.correo());
        usuarioRepository.findByCorreoIgnoreCase(correo)
                .filter(otro -> !otro.getId().equals(usuarioId))
                .ifPresent(otro -> {
                    throw ApiException.conflicto("Ya existe otra cuenta registrada con ese correo.");
                });
        if (!usuario.esAdministrador() && datos.genero() == null) {
            throw ApiException.invalido("Selecciona tu género.");
        }

        usuario.setNombre(datos.nombre().trim());
        usuario.setCorreo(correo);
        if (!usuario.esAdministrador()) {
            usuario.setGenero(datos.genero());
        }
        return cuenta(usuarioId);
    }

    public void cambiarContrasena(Long usuarioId, CambioContrasenaRequest datos) {
        Usuario usuario = buscar(usuarioId);
        if (!passwordEncoder.matches(datos.actual(), usuario.getContrasena())) {
            throw ApiException.invalido("La contraseña actual no es correcta.");
        }
        usuario.setContrasena(passwordEncoder.encode(datos.nueva()));
    }

    public void eliminarCuentaPropia(Long usuarioId) {
        Usuario usuario = buscar(usuarioId);
        if (usuario.esAdministrador()) {
            throw ApiException.prohibido("Las cuentas de administrador no se pueden eliminar desde aquí.");
        }
        eliminar(usuario);
    }

    /** Perfil público (propietario.html). Un usuario bloqueado solo lo ve el administrador. */
    @Transactional(readOnly = true)
    public UsuarioPublicoDto perfilPublico(Long usuarioId, Usuario visitante) {
        return UsuarioPublicoDto.de(buscarVisible(usuarioId, visitante));
    }

    @Transactional(readOnly = true)
    public List<AnuncioDto> anunciosDe(Long usuarioId, Usuario visitante) {
        Usuario usuario = buscarVisible(usuarioId, visitante);
        return anuncioRepository.findByPropietarioIdOrderByFechaPublicacionDescIdDesc(usuario.getId()).stream()
                .map(AnuncioDto::resumen)
                .toList();
    }

    // ===== Panel admin =====

    @Transactional(readOnly = true)
    public List<UsuarioAdminDto> listar() {
        return usuarioRepository.findAll(Sort.by("id")).stream()
                .map(UsuarioAdminDto::de)
                .toList();
    }

    public UsuarioAdminDto cambiarBloqueo(Long usuarioId, boolean bloqueado, Usuario administrador) {
        if (usuarioId.equals(administrador.getId())) {
            throw ApiException.invalido("No puedes bloquear tu propia cuenta.");
        }
        Usuario usuario = buscar(usuarioId);
        usuario.setBloqueado(bloqueado);
        return UsuarioAdminDto.de(usuario);
    }

    public void eliminarPorAdministrador(Long usuarioId, Usuario administrador) {
        if (usuarioId.equals(administrador.getId())) {
            throw ApiException.invalido("No puedes eliminar tu propia cuenta.");
        }
        eliminar(buscar(usuarioId));
    }

    /**
     * Borra la cuenta y todo lo que depende de ella: sus anuncios, favoritos,
     * reportes y solicitudes. Los chats se conservan para la otra persona, que
     * verá "Usuario eliminado".
     */
    private void eliminar(Usuario usuario) {
        anuncioRepository.findByPropietarioIdOrderByFechaPublicacionDescIdDesc(usuario.getId())
                .forEach(anuncioService::eliminarAnuncio);

        favoritoRepository.deleteByUsuario(usuario);
        reporteRepository.deleteByReportadoPor(usuario);
        solicitudRepository.deleteByUsuario(usuario);

        for (Conversacion conversacion : conversacionRepository.buscarDeUsuario(usuario)) {
            if (conversacion.otroParticipante(usuario.getId()) == null) {
                conversacionRepository.delete(conversacion); // ya no queda nadie que la pueda ver
            } else {
                conversacion.quitarParticipante(usuario.getId());
            }
        }
        mensajeRepository.findByRemitente(usuario).forEach(mensaje -> mensaje.setRemitente(null));

        usuarioRepository.delete(usuario);
    }

    private Usuario buscar(Long usuarioId) {
        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> ApiException.noEncontrado("Este usuario no existe."));
    }

    private Usuario buscarVisible(Long usuarioId, Usuario visitante) {
        Usuario usuario = buscar(usuarioId);
        boolean esAdministrador = visitante != null && visitante.esAdministrador();
        if (usuario.isBloqueado() && !esAdministrador) {
            throw ApiException.noEncontrado("Este usuario no existe o no está disponible.");
        }
        return usuario;
    }

    private static String normalizarCorreo(String correo) {
        return correo.trim().toLowerCase(Locale.ROOT);
    }
}
