package com.estudiocucuta.seguridad;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;

/**
 * Reemplaza a proteger.js y a hashSimple de datos.js: la sesión vive en el
 * servidor (cookie JSESSIONID) y las contraseñas se guardan con BCrypt.
 * Las páginas HTML, CSS, JS e imágenes son públicas; lo que se protege es la API.
 */
@Configuration
@EnableWebSecurity
public class SeguridadConfig {

    @Bean
    public SecurityFilterChain cadenaDeSeguridad(HttpSecurity http) throws Exception {
        http
                // La cookie de sesión es SameSite=Lax (ver application.properties), así que
                // otros sitios no pueden hacer peticiones con la sesión del usuario.
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(reglas -> reglas
                        .requestMatchers("/api/admin/**").hasRole("ADMINISTRADOR")
                        .requestMatchers("/api/cuenta/**", "/api/favoritos/**", "/api/conversaciones/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/anuncios", "/api/anuncios/*/reportes").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/anuncios/*").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/anuncios/*").authenticated()
                        .anyRequest().permitAll())
                // Sin sesión, la API responde 401 en vez de redirigir a una página de login.
                .exceptionHandling(errores -> errores
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .logout(salida -> salida
                        .logoutUrl("/api/auth/salir")
                        .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler(HttpStatus.OK)));
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /** Lo usa AuthController para validar correo y contraseña contra UsuarioDetallesService. */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuracion) throws Exception {
        return configuracion.getAuthenticationManager();
    }
}
