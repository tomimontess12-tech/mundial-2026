/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Seleccion {
  id: string; // Código de 3 letras (e.g., "ARG", "BRA")
  nombre: string;
  oro: number; // Medallas de oro en mundiales
  plata: number; // Medallas de plata en mundiales
  participaciones: number; // Cantidad de participaciones en mundiales
}

export interface Jugador {
  id: string;
  nombre: string;
  edad: number;
  posicion: 'Portero' | 'Defensa' | 'Centrocampista' | 'Delantero';
  dorsal: number;
  seleccionId: string; // Relación con Seleccion.id
  goles: number;
  asistencias: number;
  tarjetasAmarillas: number;
  tarjetasRojas: number;
  partidosJugados: number;
}

export type FaseTorneo = 
  | 'Fase de Grupos'
  | 'Dieciseisavos'
  | 'Octavos de Final'
  | 'Cuartos de Final'
  | 'Semifinal'
  | 'Final';

export interface Encuentro {
  id: string;
  fase: FaseTorneo;
  grupo?: string; // e.g., "Grupo A"
  localId: string; // Seleccion.id
  visitanteId: string; // Seleccion.id
  golesLocal: number | null;
  golesVisitante: number | null;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:MM
  lugar: string; // Estadio o Ciudad
  estado: 'Pendiente' | 'Finalizado';
}
