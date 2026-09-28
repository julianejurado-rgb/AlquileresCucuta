package com.estudiocucuta.config;

import com.estudiocucuta.servicio.AlmacenFotos;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Publica en /fotos/** los archivos que guarda AlmacenFotos. Las páginas del
 * sitio (HTML, CSS, JS, img) se sirven solas desde src/main/resources/static.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final AlmacenFotos almacenFotos;

    public WebConfig(AlmacenFotos almacenFotos) {
        this.almacenFotos = almacenFotos;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String ubicacion = almacenFotos.getDirectorio().toUri().toString();
        if (!ubicacion.endsWith("/")) {
            ubicacion += "/";
        }
        registry.addResourceHandler(AlmacenFotos.PREFIJO_URL + "**").addResourceLocations(ubicacion);
    }
}
