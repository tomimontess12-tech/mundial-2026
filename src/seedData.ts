/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Seleccion, Jugador, Encuentro } from './types';

export const initialSelecciones: Seleccion[] = [
  { id: 'ARG', nombre: 'Argentina', oro: 3, plata: 3, participaciones: 18 },
  { id: 'BRA', nombre: 'Brasil', oro: 5, plata: 2, participaciones: 22 },
  { id: 'ESP', nombre: 'España', oro: 1, plata: 0, participaciones: 16 },
  { id: 'FRA', nombre: 'Francia', oro: 2, plata: 2, participaciones: 16 },
  { id: 'GER', nombre: 'Alemania', oro: 4, plata: 4, participaciones: 20 },
  { id: 'URU', nombre: 'Uruguay', oro: 2, plata: 0, participaciones: 14 },
  { id: 'USA', nombre: 'Estados Unidos', oro: 0, plata: 0, participaciones: 11 },
  { id: 'MEX', nombre: 'México', oro: 0, plata: 0, participaciones: 17 },
  { id: 'CAN', nombre: 'Canadá', oro: 0, plata: 0, participaciones: 2 },
  { id: 'ITA', nombre: 'Italia', oro: 4, plata: 2, participaciones: 18 }
];

export const initialJugadores: Jugador[] = [
  // ARGENTINA
  {
    id: 'arg_messi',
    nombre: 'Lionel Messi',
    edad: 38,
    posicion: 'Delantero',
    dorsal: 10,
    seleccionId: 'ARG',
    goles: 13,
    asistencias: 8,
    tarjetasAmarillas: 1,
    tarjetasRojas: 0,
    partidosJugados: 26
  },
  {
    id: 'arg_martinez',
    nombre: 'Lautaro Martínez',
    edad: 28,
    posicion: 'Delantero',
    dorsal: 22,
    seleccionId: 'ARG',
    goles: 5,
    asistencias: 2,
    tarjetasAmarillas: 0,
    tarjetasRojas: 0,
    partidosJugados: 12
  },
  {
    id: 'arg_macallister',
    nombre: 'Alexis Mac Allister',
    edad: 27,
    posicion: 'Centrocampista',
    dorsal: 20,
    seleccionId: 'ARG',
    goles: 2,
    asistencias: 4,
    tarjetasAmarillas: 2,
    tarjetasRojas: 0,
    partidosJugados: 14
  },
  {
    id: 'arg_dibu',
    nombre: 'Emiliano Martínez',
    edad: 33,
    posicion: 'Portero',
    dorsal: 23,
    seleccionId: 'ARG',
    goles: 0,
    asistencias: 0,
    tarjetasAmarillas: 3,
    tarjetasRojas: 0,
    partidosJugados: 14
  },

  // BRASIL
  {
    id: 'bra_vini',
    nombre: 'Vinícius Júnior',
    edad: 25,
    posicion: 'Delantero',
    dorsal: 7,
    seleccionId: 'BRA',
    goles: 4,
    asistencias: 5,
    tarjetasAmarillas: 2,
    tarjetasRojas: 0,
    partidosJugados: 10
  },
  {
    id: 'bra_rodrygo',
    nombre: 'Rodrygo Silva',
    edad: 25,
    posicion: 'Delantero',
    dorsal: 10,
    seleccionId: 'BRA',
    goles: 3,
    asistencias: 3,
    tarjetasAmarillas: 0,
    tarjetasRojas: 0,
    partidosJugados: 9
  },
  {
    id: 'bra_guimaraes',
    nombre: 'Bruno Guimarães',
    edad: 28,
    posicion: 'Centrocampista',
    dorsal: 5,
    seleccionId: 'BRA',
    goles: 1,
    asistencias: 3,
    tarjetasAmarillas: 4,
    tarjetasRojas: 0,
    partidosJugados: 11
  },

  // ESPAÑA
  {
    id: 'esp_yamal',
    nombre: 'Lamine Yamal',
    edad: 18,
    posicion: 'Delantero',
    dorsal: 19,
    seleccionId: 'ESP',
    goles: 2,
    asistencias: 5,
    tarjetasAmarillas: 0,
    tarjetasRojas: 0,
    partidosJugados: 7
  },
  {
    id: 'esp_pedri',
    nombre: 'Pedri González',
    edad: 23,
    posicion: 'Centrocampista',
    dorsal: 8,
    seleccionId: 'ESP',
    goles: 1,
    asistencias: 4,
    tarjetasAmarillas: 1,
    tarjetasRojas: 0,
    partidosJugados: 10
  },
  {
    id: 'esp_rodri',
    nombre: 'Rodrigo Hernández',
    edad: 29,
    posicion: 'Centrocampista',
    dorsal: 16,
    seleccionId: 'ESP',
    goles: 3,
    asistencias: 2,
    tarjetasAmarillas: 3,
    tarjetasRojas: 0,
    partidosJugados: 15
  },

  // FRANCIA
  {
    id: 'fra_mbappe',
    nombre: 'Kylian Mbappé',
    edad: 27,
    posicion: 'Delantero',
    dorsal: 10,
    seleccionId: 'FRA',
    goles: 12,
    asistencias: 4,
    tarjetasAmarillas: 1,
    tarjetasRojas: 0,
    partidosJugados: 14
  },
  {
    id: 'fra_griezmann',
    nombre: 'Antoine Griezmann',
    edad: 35,
    posicion: 'Delantero',
    dorsal: 7,
    seleccionId: 'FRA',
    goles: 4,
    asistencias: 7,
    tarjetasAmarillas: 2,
    tarjetasRojas: 0,
    partidosJugados: 19
  },

  // ESTADOS UNIDOS
  {
    id: 'usa_pulisic',
    nombre: 'Christian Pulisic',
    edad: 27,
    posicion: 'Delantero',
    dorsal: 10,
    seleccionId: 'USA',
    goles: 4,
    asistencias: 3,
    tarjetasAmarillas: 1,
    tarjetasRojas: 0,
    partidosJugados: 11
  },
  {
    id: 'usa_mckennie',
    nombre: 'Weston McKennie',
    edad: 27,
    posicion: 'Centrocampista',
    dorsal: 8,
    seleccionId: 'USA',
    goles: 1,
    asistencias: 2,
    tarjetasAmarillas: 3,
    tarjetasRojas: 0,
    partidosJugados: 10
  },

  // MEXICO
  {
    id: 'mex_gimenez',
    nombre: 'Santiago Giménez',
    edad: 25,
    posicion: 'Delantero',
    dorsal: 9,
    seleccionId: 'MEX',
    goles: 2,
    asistencias: 1,
    tarjetasAmarillas: 1,
    tarjetasRojas: 0,
    partidosJugados: 6
  },
  {
    id: 'mex_alvarez',
    nombre: 'Edson Álvarez',
    edad: 28,
    posicion: 'Centrocampista',
    dorsal: 4,
    seleccionId: 'MEX',
    goles: 1,
    asistencias: 0,
    tarjetasAmarillas: 4,
    tarjetasRojas: 1,
    partidosJugados: 9
  }
];

export const initialEncuentros: Encuentro[] = [
  {
    id: 'enc1',
    fase: 'Fase de Grupos',
    grupo: 'Grupo A',
    localId: 'USA',
    visitanteId: 'CAN',
    golesLocal: 2,
    golesVisitante: 1,
    fecha: '2026-06-11',
    hora: '17:00',
    lugar: 'Estadio Azteca, CDMX',
    estado: 'Finalizado'
  },
  {
    id: 'enc2',
    fase: 'Fase de Grupos',
    grupo: 'Grupo A',
    localId: 'MEX',
    visitanteId: 'URU',
    golesLocal: 1,
    golesVisitante: 1,
    fecha: '2026-06-12',
    hora: '20:00',
    lugar: 'SoFi Stadium, Los Ángeles',
    estado: 'Finalizado'
  },
  {
    id: 'enc3',
    fase: 'Fase de Grupos',
    grupo: 'Grupo B',
    localId: 'ARG',
    visitanteId: 'GER',
    golesLocal: 3,
    golesVisitante: 2,
    fecha: '2026-06-13',
    hora: '18:00',
    lugar: 'MetLife Stadium, New York',
    estado: 'Finalizado'
  },
  {
    id: 'enc4',
    fase: 'Fase de Grupos',
    grupo: 'Grupo B',
    localId: 'BRA',
    visitanteId: 'ESP',
    golesLocal: 1,
    golesVisitante: 2,
    fecha: '2026-06-14',
    hora: '16:00',
    lugar: 'Mercedes-Benz Stadium, Atlanta',
    estado: 'Finalizado'
  },
  {
    id: 'enc5',
    fase: 'Semifinal',
    localId: 'ARG',
    visitanteId: 'ESP',
    golesLocal: null,
    golesVisitante: null,
    fecha: '2026-07-14',
    hora: '19:30',
    lugar: 'AT&T Stadium, Dallas',
    estado: 'Pendiente'
  },
  {
    id: 'enc6',
    fase: 'Semifinal',
    localId: 'FRA',
    visitanteId: 'BRA',
    golesLocal: null,
    golesVisitante: null,
    fecha: '2026-07-15',
    hora: '19:30',
    lugar: 'Mercedes-Benz Stadium, Atlanta',
    estado: 'Pendiente'
  },
  {
    id: 'enc7',
    fase: 'Final',
    localId: 'ARG',
    visitanteId: 'FRA',
    golesLocal: null,
    golesVisitante: null,
    fecha: '2026-07-19',
    hora: '16:00',
    lugar: 'MetLife Stadium, New York',
    estado: 'Pendiente'
  }
];
