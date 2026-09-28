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

    /** Hash BCrypt, nunca la contraseña en texto plano. */
    @Setter
    @Column(nullable = false, length = 100)
    private String contrasena;

    /** Vacío en la cuenta del administrador. */
    @Setter
    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Genero genero;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Rol rol = Rol.USUARIO;

    @Setter
    private boolean bloqueado;

    @Setter
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
