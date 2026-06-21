/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const JAVA_SQL_DUMP = {
  sqlSchema: `-- =========================================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS - MUNDIAL DE FÚTBOL 2026
-- Compatible con PostgreSQL y MySQL
-- =========================================================================

-- 1. Tabla de Selecciones
CREATE TABLE selecciones (
    id VARCHAR(3) PRIMARY KEY, -- Código nacional ISO (e.g. ARG, BRA, ESP)
    nombre VARCHAR(100) NOT NULL UNIQUE,
    oro INT DEFAULT 0 CHECK (oro >= 0),
    plata INT DEFAULT 0 CHECK (plata >= 0),
    participaciones INT DEFAULT 1 CHECK (participaciones >= 1)
);

-- 2. Tabla de Jugadores
CREATE TABLE jugadores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    edad INT CHECK (edad >= 15 AND edad <= 50),
    posicion VARCHAR(30) NOT NULL CHECK (posicion IN ('Portero', 'Defensa', 'Centrocampista', 'Delantero')),
    dorsal INT CHECK (dorsal >= 1 AND dorsal <= 99),
    seleccion_id VARCHAR(3) NOT NULL,
    goles INT DEFAULT 0 CHECK (goles >= 0),
    asistencias INT DEFAULT 0 CHECK (asistencias >= 0),
    tarjetas_amarillas INT DEFAULT 0 CHECK (tarjetas_amarillas >= 0),
    tarjetas_rojas INT DEFAULT 0 CHECK (tarjetas_rojas >= 0),
    partidos_jugados INT DEFAULT 0 CHECK (partidos_jugados >= 0),
    FOREIGN KEY (seleccion_id) REFERENCES selecciones(id) ON DELETE CASCADE
);

-- 3. Tabla de Encuentros (Partidos)
CREATE TABLE encuentros (
    id SERIAL PRIMARY KEY,
    fase VARCHAR(50) NOT NULL CHECK (fase IN ('Fase de Grupos', 'Dieciseisavos', 'Octavos de Final', 'Cuartos de Final', 'Semifinal', 'Final')),
    grupo VARCHAR(20), -- Opcional, solo para fase de grupos (e.g. 'Grupo A')
    local_id VARCHAR(3) NOT NULL,
    visitante_id VARCHAR(3) NOT NULL,
    goles_local INT CHECK (goles_local >= 0),
    goles_visitante INT CHECK (goles_visitante >= 0),
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    lugar VARCHAR(150) NOT NULL,
    estado VARCHAR(20) DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Finalizado')),
    FOREIGN KEY (local_id) REFERENCES selecciones(id) ON DELETE RESTRICT,
    FOREIGN KEY (visitante_id) REFERENCES selecciones(id) ON DELETE RESTRICT,
    CHECK (local_id <> visitante_id) -- No se puede jugar contra sí mismo
);

-- =========================================================================
-- CONSULTAS TRABAJADAS (QUERIES DE CONSULTA ESTADÍSTICA)
-- =========================================================================

-- Consulta A: Tabla de goleadores del mundial (Top Scorers) con datos del jugador y selección
SELECT j.nombre, j.posicion, s.nombre AS seleccion, j.goles, j.asistencias
FROM jugadores j
JOIN selecciones s ON j.seleccion_id = s.id
WHERE j.goles > 0
ORDER BY j.goles DESC, j.asistencias DESC
LIMIT 10;

-- Consulta B: Estadísticas agregadas por Selección (Goles anotados en liga por jugadores)
SELECT s.nombre, COUNT(j.id) AS total_jugadores, SUM(j.goles) AS goles_totales_jugadores, AVG(j.edad) AS promedio_edad
FROM selecciones s
LEFT JOIN jugadores j ON s.id = j.seleccion_id
GROUP BY s.id, s.nombre
ORDER BY goles_totales_jugadores DESC;

-- Consulta C: Resumen de encuentros finalizados con descripción legible
SELECT e.fase, s1.nombre AS local, e.goles_local, e.goles_visitante, s2.nombre AS visitante, e.lugar, e.fecha
FROM encuentros e
JOIN selecciones s1 ON e.local_id = s1.id
JOIN selecciones s2 ON e.visitante_id = s2.id
WHERE e.estado = 'Finalizado'
ORDER BY e.fecha DESC;
`,

  conexionJava: `package config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Clase utilitaria para gestionar la conexión a la Base de Datos.
 */
public class ConexionBD {
    private static final String URL = "jdbc:postgresql://localhost:5432/mundial2026";
    private static final String USER = "postgres";
    private static final String PASSWORD = "admin"; // Reemplace por su contraseña real

    private static Connection conexion = null;

    public static Connection obtenerConexion() throws SQLException {
        if (conexion == null || conexion.isClosed()) {
            try {
                // Registro del Driver de PostgreSQL
                Class.forName("org.postgresql.Driver");
                conexion = DriverManager.getConnection(URL, USER, PASSWORD);
                System.out.println("Conexión establecida con éxito.");
            } catch (ClassNotFoundException e) {
                throw new SQLException("Driver JDBC no encontrado.", e);
            }
        }
        return conexion;
    }

    public static void cerrarConexion() {
        if (conexion != null) {
            try {
                if (!conexion.isClosed()) {
                    conexion.close();
                    System.out.println("Conexión cerrada.");
                }
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
}
`,

  modelsJava: `package models;

/**
 * Entidades de Dominio en Java POJO (Plain Old Java Objects)
 * Encapsulan los datos estadísticos solicitados.
 */

// ---------------------------------------------------------
// REPRSESTACIÓN DE SELECCIÓN
// ---------------------------------------------------------
public class Seleccion {
    private String id;
    private String nombre;
    private int oro;
    private int plata;
    private int participaciones;

    public Seleccion() {}

    public Seleccion(String id, String nombre, int oro, int plata, int participaciones) {
        this.id = id;
        this.nombre = nombre;
        this.oro = oro;
        this.plata = plata;
        this.participaciones = participaciones;
    }

    // Getters y Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public int getOro() { return oro; }
    public void setOro(int oro) { this.oro = oro; }

    public int getPlata() { return plata; }
    public void setPlata(int plata) { this.plata = plata; }

    public int getParticipaciones() { return participaciones; }
    public void setParticipaciones(int participaciones) { this.participaciones = participaciones; }

    @Override
    public String toString() {
        return nombre + " (" + id + ") - Oro: " + oro + ", Plata: " + plata + ", Participaciones: " + participaciones;
    }
}


// ---------------------------------------------------------
// REPRESENTACIÓN DE JUGADOR
// ---------------------------------------------------------
public class Jugador {
    private int id;
    private String nombre;
    private int edad;
    private String posicion; // Portero, Defensa, Centrocampista, Delantero
    private int dorsal;
    private String seleccionId;
    private int goles;
    private int asistencias;
    private int tarjetasAmarillas;
    private int tarjetasRojas;
    private int partidosJugados;

    public Jugador() {}

    public Jugador(int id, String nombre, int edad, String posicion, int dorsal, String seleccionId,
                   int goles, int asistencias, int tarjetasAmarillas, int tarjetasRojas, int partidosJugados) {
        this.id = id;
        this.nombre = nombre;
        this.edad = edad;
        this.posicion = posicion;
        this.dorsal = dorsal;
        this.seleccionId = seleccionId;
        this.goles = goles;
        this.asistencias = asistencias;
        this.tarjetasAmarillas = tarjetasAmarillas;
        this.tarjetasRojas = tarjetasRojas;
        this.partidosJugados = partidosJugados;
    }

    // Getters y Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public int getEdad() { return edad; }
    public void setEdad(int edad) { this.edad = edad; }

    public String getPosicion() { return posicion; }
    public void setPosicion(String posicion) { this.posicion = posicion; }

    public int getDorsal() { return dorsal; }
    public void setDorsal(int dorsal) { this.dorsal = dorsal; }

    public String getSeleccionId() { return seleccionId; }
    public void setSeleccionId(String seleccionId) { this.seleccionId = seleccionId; }

    public int getGoles() { return goles; }
    public void setGoles(int goles) { this.goles = goles; }

    public int getAsistencias() { return asistencias; }
    public void setAsistencias(int asistencias) { this.asistencias = asistencias; }

    public int getTarjetasAmarillas() { return tarjetasAmarillas; }
    public void setTarjetasAmarillas(int tarjetasAmarillas) { this.tarjetasAmarillas = tarjetasAmarillas; }

    public int getTarjetasRojas() { return tarjetasRojas; }
    public void setTarjetasRojas(int tarjetasRojas) { this.tarjetasRojas = tarjetasRojas; }

    public int getPartidosJugados() { return partidosJugados; }
    public void setPartidosJugados(int partidosJugados) { this.partidosJugados = partidosJugados; }

    @Override
    public String toString() {
        return nombre + " (#" + dorsal + " - " + posicion + " de " + seleccionId + ")";
    }
}
`,

  daoJava: `package dao;

import config.ConexionBD;
import models.Seleccion;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * DAO (Data Access Object) para la entidad Selección.
 * Implementa la lógica CRUD de acceso a Base de Datos relacional.
 */
public class SeleccionDAO {

    // Crear / Insertar (Alta)
    public boolean insertar(Seleccion seleccion) {
        String sql = "INSERT INTO selecciones (id, nombre, oro, plata, participaciones) VALUES (?, ?, ?, ?, ?)";
        try (Connection con = ConexionBD.obtenerConexion();
             PreparedStatement ps = con.prepareStatement(sql)) {
            
            ps.setString(1, seleccion.getId().toUpperCase());
            ps.setString(2, seleccion.getNombre());
            ps.setInt(3, seleccion.getOro());
            ps.setInt(4, seleccion.getPlata());
            ps.setInt(5, seleccion.getParticipaciones());
            
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("Error al insertar selección: " + e.getMessage());
            return false;
        }
    }

    // Consultar Todos
    public List<Seleccion> listarTodos() {
        List<Seleccion> lista = new ArrayList<>();
        String sql = "SELECT * FROM selecciones ORDER BY nombre ASC";
        try (Connection con = ConexionBD.obtenerConexion();
             Statement st = con.createStatement();
             ResultSet rs = st.executeQuery(sql)) {
            
            while (rs.next()) {
                Seleccion sel = new Seleccion(
                    rs.getString("id"),
                    rs.getString("nombre"),
                    rs.getInt("oro"),
                    rs.getInt("plata"),
                    rs.getInt("participaciones")
                );
                lista.add(sel);
            }
        } catch (SQLException e) {
            System.err.println("Error al listar selecciones: " + e.getMessage());
        }
        return lista;
    }

    // Consultar por ID
    public Seleccion buscarPorId(String id) {
        String sql = "SELECT * FROM selecciones WHERE id = ?";
        try (Connection con = ConexionBD.obtenerConexion();
             PreparedStatement ps = con.prepareStatement(sql)) {
            
            ps.setString(1, id.toUpperCase());
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new Seleccion(
                        rs.getString("id"),
                        rs.getString("nombre"),
                        rs.getInt("oro"),
                        rs.getInt("plata"),
                        rs.getInt("participaciones")
                    );
                }
            }
        } catch (SQLException e) {
            System.err.println("Error al buscar selección: " + e.getMessage());
        }
        return null; // No encontrado
    }

    // Modificar / Actualizar
    public boolean actualizar(Seleccion seleccion) {
        String sql = "UPDATE selecciones SET nombre = ?, oro = ?, plata = ?, participaciones = ? WHERE id = ?";
        try (Connection con = ConexionBD.obtenerConexion();
             PreparedStatement ps = con.prepareStatement(sql)) {
            
            ps.setString(1, seleccion.getNombre());
            ps.setInt(2, seleccion.getOro());
            ps.setInt(3, seleccion.getPlata());
            ps.setInt(4, seleccion.getParticipaciones());
            ps.setString(5, seleccion.getId().toUpperCase());
            
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("Error al actualizar selección: " + e.getMessage());
            return false;
        }
    }

    // Eliminar (Baja)
    public boolean eliminar(String id) {
        String sql = "DELETE FROM selecciones WHERE id = ?";
        try (Connection con = ConexionBD.obtenerConexion();
             PreparedStatement ps = con.prepareStatement(sql)) {
            
            ps.setString(1, id.toUpperCase());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("Error al eliminar selección: " + e.getMessage());
            return false;
        }
    }
}
`
};
