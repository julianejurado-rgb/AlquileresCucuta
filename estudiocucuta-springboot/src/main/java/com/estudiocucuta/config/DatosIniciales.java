package com.estudiocucuta.config;

import com.estudiocucuta.modelo.Anuncio;
import com.estudiocucuta.modelo.Ciudad;
import com.estudiocucuta.modelo.EstadoAnuncio;
import com.estudiocucuta.modelo.Genero;
import com.estudiocucuta.modelo.GeneroPermitido;
import com.estudiocucuta.modelo.Rol;
import com.estudiocucuta.modelo.SolicitudVerificacion;
import com.estudiocucuta.modelo.TipoInmueble;
import com.estudiocucuta.modelo.Usuario;
import com.estudiocucuta.repositorio.AnuncioRepository;
import com.estudiocucuta.repositorio.SolicitudVerificacionRepository;
import com.estudiocucuta.repositorio.UsuarioRepository;
import java.math.BigDecimal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Al arrancar con la base de datos vacía crea la cuenta del administrador
 * (antes sembrarAdministrador en datos.js) y, si app.datos-demo=true, dos
 * usuarios y dos anuncios de ejemplo con las fotos de /img.
 */
@Component
public class DatosIniciales implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatosIniciales.class);
    private static final String CONTRASENA_DEMO = "demo123";

    private final UsuarioRepository usuarioRepository;
    private final AnuncioRepository anuncioRepository;
    private final SolicitudVerificacionRepository solicitudRepository;
    private final PasswordEncoder passwordEncoder;
    private final String correoAdministrador;
    private final String contrasenaAdministrador;
    private final boolean datosDemo;

    public DatosIniciales(UsuarioRepository usuarioRepository,
                          AnuncioRepository anuncioRepository,
                          SolicitudVerificacionRepository solicitudRepository,
                          PasswordEncoder passwordEncoder,
                          @Value("${app.admin.correo}") String correoAdministrador,
                          @Value("${app.admin.contrasena}") String contrasenaAdministrador,
                          @Value("${app.datos-demo:false}") boolean datosDemo) {
        this.usuarioRepository = usuarioRepository;
        this.anuncioRepository = anuncioRepository;
        this.solicitudRepository = solicitudRepository;
        this.passwordEncoder = passwordEncoder;
        this.correoAdministrador = correoAdministrador;
        this.contrasenaAdministrador = contrasenaAdministrador;
        this.datosDemo = datosDemo;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (usuarioRepository.count() > 0) {
            return;
        }

        usuarioRepository.save(new Usuario("Administrador", correoAdministrador,
                passwordEncoder.encode(contrasenaAdministrador), null, Rol.ADMINISTRADOR));
        log.info("Cuenta de administrador creada: {}", correoAdministrador);

        if (datosDemo) {
            crearDatosDeEjemplo();
        }
    }

    private void crearDatosDeEjemplo() {
        Usuario laura = crearUsuario("Laura Gómez", "laura@ejemplo.test", Genero.MUJER);
        laura.setVerificado(true);
        Usuario andres = crearUsuario("Andrés Pérez", "andres@ejemplo.test", Genero.HOMBRE);
        solicitudRepository.save(new SolicitudVerificacion(andres));

        Anuncio caobos = new Anuncio();
        caobos.setPropietario(laura);
        caobos.setTitulo("Apartaestudio amoblado en Caobos");
        caobos.setDescripcion("Apartaestudio con cocina integral, sala con televisor y buena iluminación. "
                + "Incluye servicios públicos e internet. Cerca de centros comerciales y rutas de bus.");
        caobos.setTipo(TipoInmueble.APARTAESTUDIO);
        caobos.setPrecio(new BigDecimal("720000"));
        caobos.setCiudad(Ciudad.CUCUTA);
        caobos.setBarrio("Caobos");
        caobos.setEstado(EstadoAnuncio.DISPONIBLE);
        caobos.setArea(32);
        caobos.setAmoblado(true);
        caobos.setMascotas(true);
        caobos.setGeneroPermitido(GeneroPermitido.TODOS);
        agregarFotos(caobos, "anuncio-01");
        anuncioRepository.save(caobos);

        Anuncio riviera = new Anuncio();
        riviera.setPropietario(andres);
        riviera.setTitulo("Habitación con baño privado en La Riviera");
        riviera.setDescripcion("Habitación amplia con baño privado, cama doble, tocador y comedor pequeño. "
                + "Ventanales con mucha luz natural. Ideal para estudiante o profesional.");
        riviera.setTipo(TipoInmueble.HABITACION);
        riviera.setPrecio(new BigDecimal("480000"));
        riviera.setCiudad(Ciudad.CUCUTA);
        riviera.setBarrio("La Riviera");
        riviera.setEstado(EstadoAnuncio.DISPONIBLE);
        riviera.setArea(20);
        riviera.setAmoblado(true);
        riviera.setMascotas(false);
        riviera.setGeneroPermitido(GeneroPermitido.MUJERES);
        agregarFotos(riviera, "anuncio-02");
        anuncioRepository.save(riviera);

        // Sin tildes ni ñ: algunas consolas de Windows las muestran mal.
        log.info("Datos de ejemplo creados: laura@ejemplo.test y andres@ejemplo.test (clave {})", CONTRASENA_DEMO);
    }

    private Usuario crearUsuario(String nombre, String correo, Genero genero) {
        return usuarioRepository.save(new Usuario(nombre, correo, passwordEncoder.encode(CONTRASENA_DEMO), genero, Rol.USUARIO));
    }

    /** Usa las fotos que ya venían en la carpeta img (anuncio-01.jpg, anuncio-01b.jpg, …). */
    private static void agregarFotos(Anuncio anuncio, String prefijo) {
        String[] sufijos = {"", "b", "c", "d", "e"};
        for (int i = 0; i < sufijos.length; i++) {
            anuncio.agregarFoto("/img/" + prefijo + sufijos[i] + ".jpg", i);
        }
    }
}
