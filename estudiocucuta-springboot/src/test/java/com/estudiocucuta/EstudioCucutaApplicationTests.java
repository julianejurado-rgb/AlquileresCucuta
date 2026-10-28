package com.estudiocucuta;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Usa el perfil "h2" (base en memoria) para que la prueba no dependa de que
 * MySQL esté instalado y corriendo, y no toque los datos reales.
 */
@SpringBootTest
@ActiveProfiles("h2")
class EstudioCucutaApplicationTests {

    /** Comprueba que la aplicación arranca: entidades, repositorios, seguridad y datos iniciales. */
    @Test
    void contextLoads() {
    }
}
