package com.estudiocucuta.servicio;

import com.estudiocucuta.dto.AnuncioDto;
import com.estudiocucuta.dto.AnuncioRequest;
import com.estudiocucuta.dto.FiltroAnuncios;
import com.estudiocucuta.dto.ResultadoBusquedaDto;
import com.estudiocucuta.excepcion.ApiException;
import com.estudiocucuta.modelo.Anuncio;
import com.estudiocucuta.modelo.EstadoAnuncio;
import com.estudiocucuta.modelo.EstadoReporte;
import com.estudiocucuta.modelo.FotoAnuncio;
import com.estudiocucuta.modelo.GeneroPermitido;
import com.estudiocucuta.modelo.Usuario;
import com.estudiocucuta.repositorio.AnuncioRepository;
import com.estudiocucuta.repositorio.AnuncioSpecs;
import com.estudiocucuta.repositorio.ConversacionRepository;
import com.estudiocucuta.repositorio.FavoritoRepository;
import com.estudiocucuta.repositorio.ReporteRepository;
import com.estudiocucuta.repositorio.UsuarioRepository;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional
public class AnuncioService {

    public static final int MAXIMO_FOTOS = 10;

    private static final String NO_DISPONIBLE = "Este anuncio ya no está disponible o el enlace no es válido.";

    private final AnuncioRepository anuncioRepository;
    private final UsuarioRepository usuarioRepository;
    private final FavoritoRepository favoritoRepository;
    private final ReporteRepository reporteRepository;
    private final ConversacionRepository conversacionRepository;
    private final AlmacenFotos almacenFotos;

    public AnuncioService(AnuncioRepository anuncioRepository,
                          UsuarioRepository usuarioRepository,
                          FavoritoRepository favoritoRepository,
                          ReporteRepository reporteRepository,
                          ConversacionRepository conversacionRepository,
                          AlmacenFotos almacenFotos) {
        this.anuncioRepository = anuncioRepository;
        this.usuarioRepository = usuarioRepository;
        this.favoritoRepository = favoritoRepository;
        this.reporteRepository = reporteRepository;
        this.conversacionRepository = conversacionRepository;
        this.almacenFotos = almacenFotos;
    }

    /** Listado público con filtros (index.html). Nunca incluye anuncios de usuarios bloqueados. */
    @Transactional(readOnly = true)
    public ResultadoBusquedaDto buscar(FiltroAnuncios filtro, Usuario visitante) {
        Specification<Anuncio> visibles = AnuncioSpecs.propietarioActivo();
        long total = anuncioRepository.count(visibles);

        if (filtro.soloFavoritos() && visitante == null) {
            return new ResultadoBusquedaDto(total, List.of());
        }
        Long favoritosDe = filtro.soloFavoritos() ? visitante.getId() : null;

        Specification<Anuncio> consulta = visibles
                .and(AnuncioSpecs.contieneTexto(filtro.q()))
                .and(AnuncioSpecs.enCiudad(filtro.ciudad()))
                .and(AnuncioSpecs.precioHasta(filtro.precioMax()))
                .and(AnuncioSpecs.deTipo(filtro.tipo()))
                .and(AnuncioSpecs.admiteGenero(filtro.genero()))
                .and(AnuncioSpecs.conMascotas(filtro.mascotas()))
                .and(AnuncioSpecs.amoblado(filtro.amoblado()))
                .and(AnuncioSpecs.favoritosDe(favoritosDe));

        List<AnuncioDto> anuncios = anuncioRepository.findAll(consulta, ordenar(filtro.orden())).stream()
                .map(AnuncioDto::resumen)
                .toList();
        return new ResultadoBusquedaDto(total, anuncios);
    }

    @Transactional(readOnly = true)
    public AnuncioDto detalle(Long anuncioId, Usuario visitante) {
        Anuncio anuncio = buscarVisible(anuncioId, visitante);
        boolean reportadoPorMi = visitante != null
                && reporteRepository.existsByAnuncioAndReportadoPorAndEstado(anuncio, visitante, EstadoReporte.PENDIENTE);
        return AnuncioDto.detalle(anuncio, reportadoPorMi);
    }

    public AnuncioDto crear(AnuncioRequest datos, List<MultipartFile> fotos, Long usuarioId) {
        Usuario propietario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> ApiException.noAutenticado("Debes iniciar sesión."));
        if (propietario.esAdministrador()) {
            throw ApiException.prohibido("Los administradores no publican anuncios.");
        }
        List<MultipartFile> nuevas = conContenido(fotos);
        validarCantidadDeFotos(nuevas.size());

        Anuncio anuncio = new Anuncio();
        anuncio.setPropietario(propietario);
        aplicarDatos(anuncio, datos);
        guardarFotos(anuncio, nuevas, 0);
        return AnuncioDto.detalle(anuncioRepository.save(anuncio), false);
    }

    /** Solo el propietario puede editar (el administrador puede eliminar, pero no editar). */
    public AnuncioDto actualizar(Long anuncioId, AnuncioRequest datos, List<MultipartFile> fotos, Long usuarioId) {
        Anuncio anuncio = buscar(anuncioId);
        if (!anuncio.getPropietario().getId().equals(usuarioId)) {
            throw ApiException.prohibido("Solo el propietario puede editar este anuncio.");
        }
        List<MultipartFile> nuevas = conContenido(fotos);

        // Fotos que ya tenía y siguen en el formulario, en el orden en que llegaron.
        List<String> urlsActuales = anuncio.getFotos().stream().map(FotoAnuncio::getUrl).toList();
        List<String> conservadas = datos.fotosConservadas() == null ? List.of()
                : datos.fotosConservadas().stream().filter(urlsActuales::contains).distinct().toList();
        validarCantidadDeFotos(conservadas.size() + nuevas.size());

        List<String> quitadas = urlsActuales.stream().filter(url -> !conservadas.contains(url)).toList();
        anuncio.getFotos().removeIf(foto -> quitadas.contains(foto.getUrl()));
        anuncio.getFotos().forEach(foto -> foto.setOrden(conservadas.indexOf(foto.getUrl())));

        aplicarDatos(anuncio, datos);
        guardarFotos(anuncio, nuevas, conservadas.size());
        quitadas.forEach(almacenFotos::eliminar);
        return AnuncioDto.detalle(anuncio, false);
    }

    /** Lo puede eliminar su propietario o un administrador. */
    public void eliminar(Long anuncioId, Usuario actor) {
        Anuncio anuncio = buscar(anuncioId);
        boolean esPropietario = anuncio.getPropietario().getId().equals(actor.getId());
        if (!esPropietario && !actor.esAdministrador()) {
            throw ApiException.prohibido("No puedes eliminar este anuncio.");
        }
        eliminarAnuncio(anuncio);
    }

    /**
     * Borra el anuncio con sus fotos, favoritos y reportes. Los chats que
     * empezaron desde él se conservan, sin la referencia al anuncio.
     * También lo usa UsuarioService al eliminar una cuenta.
     */
    public void eliminarAnuncio(Anuncio anuncio) {
        favoritoRepository.deleteByAnuncio(anuncio);
        reporteRepository.deleteByAnuncio(anuncio);
        conversacionRepository.findByAnuncioOrigen(anuncio)
                .forEach(conversacion -> conversacion.setAnuncioOrigen(null));

        List<String> urls = anuncio.getFotos().stream().map(FotoAnuncio::getUrl).toList();
        anuncioRepository.delete(anuncio);
        urls.forEach(almacenFotos::eliminar);
    }

    /** Las visitas del propio propietario no cuentan, para no inflar su estadística. */
    public void registrarVisita(Long anuncioId, Usuario visitante) {
        Anuncio anuncio = buscarVisible(anuncioId, visitante);
        boolean esPropietario = visitante != null && anuncio.getPropietario().getId().equals(visitante.getId());
        if (!esPropietario) {
            anuncio.setVisitas(anuncio.getVisitas() + 1);
        }
    }

    /** "Mis publicaciones": con el número de contactos de cada anuncio. */
    @Transactional(readOnly = true)
    public List<AnuncioDto> misAnuncios(Long usuarioId) {
        return anuncioRepository.findByPropietarioIdOrderByFechaPublicacionDescIdDesc(usuarioId).stream()
                .map(anuncio -> AnuncioDto.conContactos(anuncio, conversacionRepository.countByAnuncioOrigen(anuncio)))
                .toList();
    }

    /** Panel admin: todos, incluidos los de usuarios bloqueados, para poder moderarlos. */
    @Transactional(readOnly = true)
    public List<AnuncioDto> todos() {
        return anuncioRepository.findAllByOrderByFechaPublicacionDescIdDesc().stream()
                .map(AnuncioDto::resumen)
                .toList();
    }

    private Anuncio buscar(Long anuncioId) {
        return anuncioRepository.findById(anuncioId)
                .orElseThrow(() -> ApiException.noEncontrado(NO_DISPONIBLE));
    }

    /** Los anuncios de usuarios bloqueados solo los ve el administrador. */
    private Anuncio buscarVisible(Long anuncioId, Usuario visitante) {
        Anuncio anuncio = buscar(anuncioId);
        boolean esAdministrador = visitante != null && visitante.esAdministrador();
        if (anuncio.getPropietario().isBloqueado() && !esAdministrador) {
            throw ApiException.noEncontrado(NO_DISPONIBLE);
        }
        return anuncio;
    }

    private static void aplicarDatos(Anuncio anuncio, AnuncioRequest datos) {
        anuncio.setTitulo(datos.titulo().trim());
        anuncio.setDescripcion(datos.descripcion().trim());
        anuncio.setTipo(datos.tipo());
        anuncio.setPrecio(datos.precio());
        anuncio.setCiudad(datos.ciudad());
        anuncio.setBarrio(datos.barrio().trim());
        anuncio.setEstado(datos.estado() != null ? datos.estado() : EstadoAnuncio.DISPONIBLE);
        anuncio.setTelefono(textoOpcional(datos.telefono()));
        anuncio.setArea(datos.area());
        anuncio.setAmoblado(datos.amoblado());
        anuncio.setMascotas(datos.mascotas());
        anuncio.setGeneroPermitido(datos.generoPermitido() != null ? datos.generoPermitido() : GeneroPermitido.TODOS);
    }

    private void guardarFotos(Anuncio anuncio, List<MultipartFile> archivos, int ordenInicial) {
        int orden = ordenInicial;
        for (MultipartFile archivo : archivos) {
            anuncio.agregarFoto(almacenFotos.guardar(archivo), orden++);
        }
    }

    private static List<MultipartFile> conContenido(List<MultipartFile> archivos) {
        if (archivos == null) {
            return List.of();
        }
        return archivos.stream().filter(archivo -> !archivo.isEmpty()).toList();
    }

    private static void validarCantidadDeFotos(int cantidad) {
        if (cantidad > MAXIMO_FOTOS) {
            throw ApiException.invalido("Un anuncio puede tener máximo " + MAXIMO_FOTOS + " fotos.");
        }
    }

    private static String textoOpcional(String texto) {
        return texto == null || texto.isBlank() ? null : texto.trim();
    }

    private static Sort ordenar(String orden) {
        if ("antiguos".equals(orden)) {
            return Sort.by(Sort.Direction.ASC, "fechaPublicacion", "id");
        }
        if ("precio-asc".equals(orden)) {
            return Sort.by(Sort.Direction.ASC, "precio", "id");
        }
        if ("precio-desc".equals(orden)) {
            return Sort.by(Sort.Direction.DESC, "precio", "id");
        }
        return Sort.by(Sort.Direction.DESC, "fechaPublicacion", "id");
    }
}
