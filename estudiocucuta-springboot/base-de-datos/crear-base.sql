-- ============================================================================
-- Crea la base de datos de EstudioCúcuta y el usuario con el que se conecta
-- la aplicación. Se corre una sola vez, como root:
--
--   mysql -u root -p < base-de-datos/crear-base.sql
--
-- Las tablas NO se crean aquí: las crea Hibernate al arrancar la aplicación
-- (spring.jpa.hibernate.ddl-auto=update), a partir de las entidades de modelo/.
-- Si cambias la contraseña de este usuario, cámbiala también en
-- application.properties (o define la variable de entorno DB_CONTRASENA).
-- ============================================================================

CREATE DATABASE IF NOT EXISTS estudiocucuta
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

-- Usuario propio de la aplicación: solo puede entrar desde este computador y
-- solo tiene permisos sobre la base estudiocucuta (no es root).
CREATE USER IF NOT EXISTS 'estudiocucuta'@'localhost' IDENTIFIED BY 'EstudioCucuta2026';
GRANT ALL PRIVILEGES ON estudiocucuta.* TO 'estudiocucuta'@'localhost';
