package com.estudiocucuta.modelo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Cuenta de una persona en el sitio. Cualquier usuario puede publicar
 * anuncios y también contactar a otros propietarios: "propietario" e
 * "interesado" son papeles dentro de una relación, no tipos de usuario.
 *
 * Los getters (@Getter, en toda la clase) y los setters (@Setter, solo en
 * los campos que se pueden modificar después de crear el usuario: no hay
 * setId ni setRol) los genera Lombok al compilar; no están escritos aquí,
 * pero sí existen en el .class.
 *
 * Los enums se guardan con su nombre (EnumType.STRING), así que el largo de
 * esas columnas es el del nombre más largo, no la cantidad de opciones.
 */
@Entity
@Table(name = "usuarios")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Setter
    @Column(nullable = false, length = 100)
    private String nombre;

    /** Único y siempre en minúsculas. */
    @Setter
    @Column(nullable = false, unique = true, length = 150)
    private String correo;

    /** Hash BCrypt, nunca la contraseña en texto plano. Un hash BCrypt siempre mide 60 caracteres. */
    @Setter
    @Column(nullable = false, length = 60)
    private String contrasena;

    /** HOMBRE o MUJER (el más largo, 6 letras). Vacío en la cuenta del administrador. */
    @Setter
    @Enumerated(EnumType.STRING)
    @Column(length = 6)
    private Genero genero;

    /** USUARIO o ADMINISTRADOR (el más largo, 13 letras). Se fija al crear la cuenta. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 13)
    private Rol rol;

    /** Si un administrador lo bloqueó, no puede iniciar sesión y sus anuncios se ocultan. */
    @Setter
    @Column(nullable = false)
    private boolean bloqueado;

    /** Se vuelve true cuando un administrador aprueba su solicitud de verificación. */
    @Setter
    @Column(nullable = false)
    private boolean verificado;

    public Usuario(String nombre, String correo, String contrasena, Genero genero, Rol rol) {
        this.nombre = nombre;
        this.correo = correo;
        this.contrasena = contrasena;
        this.genero = genero;
        this.rol = rol;
    }

    public boolean esAdministrador() {
        return rol == Rol.ADMINISTRADOR;
    }
}
