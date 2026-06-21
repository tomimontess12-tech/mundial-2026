/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Database, 
  LayoutDashboard, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Filter, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  MapPin, 
  Zap, 
  Copy, 
  Check, 
  X, 
  ArrowLeftRight, 
  SearchCode,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Seleccion, Jugador, Encuentro, FaseTorneo } from './types';
import { initialSelecciones, initialJugadores, initialEncuentros } from './seedData';
import { JAVA_SQL_DUMP } from './javaExport';

export default function App() {
  // --- STATE PERSISTENCE ---
  const [selecciones, setSelecciones] = useState<Seleccion[]>(() => {
    const saved = localStorage.getItem('mundial_2026_selecciones');
    return saved ? (JSON.parse(saved) as Seleccion[]) : initialSelecciones;
  });

  const [jugadores, setJugadores] = useState<Jugador[]>(() => {
    const saved = localStorage.getItem('mundial_2026_jugadores');
    return saved ? (JSON.parse(saved) as Jugador[]) : initialJugadores;
  });

  const [encuentros, setEncuentros] = useState<Encuentro[]>(() => {
    const saved = localStorage.getItem('mundial_2026_encuentros');
    return saved ? (JSON.parse(saved) as Encuentro[]) : initialEncuentros;
  });

  useEffect(() => {
    localStorage.setItem('mundial_2026_selecciones', JSON.stringify(selecciones));
  }, [selecciones]);

  useEffect(() => {
    localStorage.setItem('mundial_2026_jugadores', JSON.stringify(jugadores));
  }, [jugadores]);

  useEffect(() => {
    localStorage.setItem('mundial_2026_encuentros', JSON.stringify(encuentros));
  }, [encuentros]);

  // --- NAVIGATION ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'selecciones' | 'jugadores' | 'encuentros' | 'export'>('dashboard');

  // --- SEARCH & FILTERS ---
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [posFilter, setPosFilter] = useState('ALL');
  const [faseFilter, setFaseFilter] = useState<FaseTorneo | 'ALL'>('ALL');
  const [estadoFilter, setEstadoFilter] = useState<'ALL' | 'Pendiente' | 'Finalizado'>('ALL');

  // --- SYSTEM MESSAGE / NOTIFICATIONS ---
  const [notification, setNotification] = useState<{ id: string; text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showNotification = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString();
    setNotification({ id, text, type });
    setTimeout(() => {
      setNotification(prev => prev?.id === id ? null : prev);
    }, 4000);
  };

  // --- MODALS STATS & SHAPES ---
  const [isSelModalOpen, setIsSelModalOpen] = useState(false);
  const [editingSel, setEditingSel] = useState<Seleccion | null>(null);

  const [isJugModalOpen, setIsJugModalOpen] = useState(false);
  const [editingJug, setEditingJug] = useState<Jugador | null>(null);

  const [isEncModalOpen, setIsEncModalOpen] = useState(false);
  const [editingEnc, setEditingEnc] = useState<Encuentro | null>(null);

  // Quick Action: Score Reporter
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [closingEnc, setClosingEnc] = useState<Encuentro | null>(null);
  const [scoreLocal, setScoreLocal] = useState<number>(0);
  const [scoreVisitante, setScoreVisitante] = useState<number>(0);
  const [goalScorers, setGoalScorers] = useState<{ id: string; qty: number }[]>([]);

  // Java & SQL Source view tabs
  const [exportSubTab, setExportSubTab] = useState<'sql' | 'pojo' | 'conn' | 'dao'>('sql');
  const [copiedText, setCopiedText] = useState(false);

  // --- CRUD HANDLERS FOR SELECCIONES ---
  const handleSaveSeleccion = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = (formData.get('id') as string).toUpperCase().trim();
    const nombre = formData.get('nombre') as string;
    const oro = Number(formData.get('oro') || 0);
    const plata = Number(formData.get('plata') || 0);
    const participaciones = Number(formData.get('participaciones') || 1);

    if (!id || id.length !== 3) {
      showNotification('El código de la selección debe tener exactamente 3 letras.', 'error');
      return;
    }
    if (!nombre) {
      showNotification('El nombre es obligatorio.', 'error');
      return;
    }

    if (editingSel) {
      // Edit
      setSelecciones(prev => prev.map(s => s.id === editingSel.id ? { ...s, nombre, oro, plata, participaciones } : s));
      showNotification(`Selección "${nombre}" actualizada correctamente.`);
    } else {
      // Add New
      if (selecciones.some(s => s.id === id)) {
        showNotification(`Ya existe una selección con el código ISO "${id}".`, 'error');
        return;
      }
      const newSel: Seleccion = { id, nombre, oro, plata, participaciones };
      setSelecciones(prev => [...prev, newSel]);
      showNotification(`Selección "${nombre}" agregada correctamente.`);
    }
    setIsSelModalOpen(false);
    setEditingSel(null);
  };

  const handleDeleteSeleccion = (id: string, name: string) => {
    // Check if team has players or matches
    const hasPlayers = jugadores.some(j => j.seleccionId === id);
    const hasMatches = encuentros.some(e => e.localId === id || e.visitanteId === id);

    if (hasPlayers || hasMatches) {
      if (!confirm(`La selección ${name} tiene jugadores o encuentros asociados. Si la elimina, se verán afectados. ¿Proceder de todos modos?`)) {
        return;
      }
    }
    setSelecciones(prev => prev.filter(s => s.id !== id));
    // Cascade delete players
    setJugadores(prev => prev.filter(j => j.seleccionId !== id));
    // Cascade delete encuentros
    setEncuentros(prev => prev.filter(e => e.localId !== id && e.visitanteId !== id));
    showNotification(`Selección ${name} y sus datos asociados eliminados.`, 'info');
  };

  // --- CRUD HANDLERS FOR JUGADORES ---
  const handleSaveJugador = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nombre = formData.get('nombre') as string;
    const edad = Number(formData.get('edad') || 20);
    const posicion = formData.get('posicion') as any;
    const dorsal = Number(formData.get('dorsal') || 1);
    const seleccionId = formData.get('seleccionId') as string;
    
    // Stats
    const goles = Number(formData.get('goles') || 0);
    const asistencias = Number(formData.get('asistencias') || 0);
    const amarillas = Number(formData.get('tarjetasAmarillas') || 0);
    const rojas = Number(formData.get('tarjetasRojas') || 0);
    const partidosJugados = Number(formData.get('partidosJugados') || 0);

    if (!nombre) {
      showNotification('El nombre del jugador es obligatorio.', 'error');
      return;
    }
    if (!seleccionId) {
      showNotification('Debe seleccionar un equipo nacional.', 'error');
      return;
    }

    if (editingJug) {
      setJugadores(prev => prev.map(j => j.id === editingJug.id ? {
        ...j,
        nombre,
        edad,
        posicion,
        dorsal,
        seleccionId,
        goles,
        asistencias,
        tarjetasAmarillas: amarillas,
        tarjetasRojas: rojas,
        partidosJugados
      } : j));
      showNotification(`Jugador "${nombre}" actualizado correctamente.`);
    } else {
      const newJug: Jugador = {
        id: 'jug_' + Date.now().toString(),
        nombre,
        edad,
        posicion,
        dorsal,
        seleccionId,
        goles,
        asistencias,
        tarjetasAmarillas: amarillas,
        tarjetasRojas: rojas,
        partidosJugados
      };
      setJugadores(prev => [...prev, newJug]);
      showNotification(`Jugador "${nombre}" agregado con éxito.`);
    }
    setIsJugModalOpen(false);
    setEditingJug(null);
  };

  const handleDeleteJugador = (id: string, name: string) => {
    setJugadores(prev => prev.filter(j => j.id !== id));
    showNotification(`Jugador "${name}" eliminado.`, 'info');
  };

  // --- CRUD HANDLERS FOR ENCUENTROS ---
  const handleSaveEncuentro = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const fase = formData.get('fase') as FaseTorneo;
    const grupo = formData.get('grupo') as string;
    const localId = formData.get('localId') as string;
    const visitanteId = formData.get('visitanteId') as string;
    const fecha = formData.get('fecha') as string;
    const hora = formData.get('hora') as string;
    const lugar = formData.get('lugar') as string;
    const estado = formData.get('estado') as 'Pendiente' | 'Finalizado';

    if (localId === visitanteId) {
      showNotification('Una selección no puede jugar contra sí misma.', 'error');
      return;
    }
    if (!localId || !visitanteId) {
      showNotification('Ambas selecciones son obligatorias.', 'error');
      return;
    }

    // Goles
    const golesLocalVal = formData.get('golesLocal');
    const golesVisitanteVal = formData.get('golesVisitante');
    const golesLocal = golesLocalVal !== '' && golesLocalVal !== null ? Number(golesLocalVal) : null;
    const golesVisitante = golesVisitanteVal !== '' && golesVisitanteVal !== null ? Number(golesVisitanteVal) : null;

    if (editingEnc) {
      setEncuentros(prev => prev.map(enc => enc.id === editingEnc.id ? {
        ...enc,
        fase,
        grupo: fase === 'Fase de Grupos' ? grupo : undefined,
        localId,
        visitanteId,
        golesLocal,
        golesVisitante,
        fecha,
        hora,
        lugar,
        estado
      } : enc));
      showNotification(`Partido actualizado correctamente.`);
    } else {
      const newEnc: Encuentro = {
        id: 'enc_' + Date.now().toString(),
        fase,
        grupo: fase === 'Fase de Grupos' ? (grupo || 'Grupo A') : undefined,
        localId,
        visitanteId,
        golesLocal,
        golesVisitante,
        fecha,
        hora,
        lugar,
        estado: 'Pendiente'
      };
      setEncuentros(prev => [...prev, newEnc]);
      showNotification(`Partido programado con éxito.`);
    }
    setIsEncModalOpen(false);
    setEditingEnc(null);
  };

  const handleDeleteEncuentro = (id: string) => {
    setEncuentros(prev => prev.filter(e => e.id !== id));
    showNotification('Partido cancelado/eliminado.', 'info');
  };

  // --- INTERACTIVE TOURNEY SIMULATOR ENGINE ---
  const handleOpenScoreReporter = (enc: Encuentro) => {
    setClosingEnc(enc);
    setScoreLocal(0);
    setScoreVisitante(0);
    // Prepare potential list of scorers from both teams
    const teamPlayers = jugadores.filter(j => j.seleccionId === enc.localId || j.seleccionId === enc.visitanteId);
    setGoalScorers(teamPlayers.map(p => ({ id: p.id, qty: 0 })));
    setIsScoreModalOpen(true);
  };

  const handleIncrementScorer = (playerID: string) => {
    setGoalScorers(prev => prev.map(gs => gs.id === playerID ? { ...gs, qty: gs.qty + 1 } : gs));
  };

  const handleDecrementScorer = (playerID: string) => {
    setGoalScorers(prev => prev.map(gs => gs.id === playerID ? { ...gs, qty: Math.max(0, gs.qty - 1) } : gs));
  };

  const handleApplyMatchResults = () => {
    if (!closingEnc) return;

    const totalScored = goalScorers.reduce((acc, curr) => acc + curr.qty, 0);
    const sumGolesReporter = scoreLocal + scoreVisitante;

    // Check if assigned players' goals equal the match results sum
    if (totalScored !== sumGolesReporter) {
      if (!confirm(`El total de goles declarados (${sumGolesReporter}) no coincide con los goles asignados a los jugadores (${totalScored}). ¿Desea continuar de todas formas? (Los goles individuales se sumarán a sus estadísticas igualmente).`)) {
        return;
      }
    }

    // 1. Update the match
    setEncuentros(prev => prev.map(e => e.id === closingEnc.id ? {
      ...e,
      golesLocal: scoreLocal,
      golesVisitante: scoreVisitante,
      estado: 'Finalizado'
    } : e));

    // 2. Increment stats for each player who scored
    setJugadores(prev => prev.map(j => {
      const scorerRecord = goalScorers.find(gs => gs.id === j.id);
      if (scorerRecord && scorerRecord.qty > 0) {
        return {
          ...j,
          goles: j.goles + scorerRecord.qty,
          partidosJugados: j.partidosJugados + 1
        };
      }
      // Also increment play counts for players of the active rosters
      if (j.seleccionId === closingEnc.localId || j.seleccionId === closingEnc.visitanteId) {
        return {
          ...j,
          partidosJugados: j.partidosJugados + 1
        };
      }
      return j;
    }));

    setIsScoreModalOpen(false);
    setClosingEnc(null);
    showNotification('Resultado oficial cargado y estadísticas de jugadores actualizadas con éxito!');
  };

  const handleQuickSimulate = (enc: Encuentro) => {
    // Generate realistic football scores
    const homePower = selecciones.find(s => s.id === enc.localId)?.oro || 0;
    const awayPower = selecciones.find(s => s.id === enc.visitanteId)?.oro || 0;

    // Base score + random chance weighted by soccer legacy
    const homeBase = Math.floor(Math.random() * 3) + (homePower > awayPower ? 1 : 0);
    const awayBase = Math.floor(Math.random() * 3) + (awayPower > homePower ? 1 : 0);

    const matchScoreLocal = homeBase;
    const matchScoreVisitante = awayBase;

    // Auto-attribute scorers randomly
    const localRoster = jugadores.filter(j => j.seleccionId === enc.localId && j.posicion !== 'Portero');
    const visitanteRoster = jugadores.filter(j => j.seleccionId === enc.visitanteId && j.posicion !== 'Portero');

    const updatedPlayers = [...jugadores];

    // Distribute home goals
    for (let i = 0; i < matchScoreLocal; i++) {
      if (localRoster.length > 0) {
        const scorer = localRoster[Math.floor(Math.random() * localRoster.length)];
        const index = updatedPlayers.findIndex(u => u.id === scorer.id);
        if (index !== -1) {
          updatedPlayers[index].goles += 1;
        }
      }
    }

    // Distribute away goals
    for (let i = 0; i < matchScoreVisitante; i++) {
      if (visitanteRoster.length > 0) {
        const scorer = visitanteRoster[Math.floor(Math.random() * visitanteRoster.length)];
        const index = updatedPlayers.findIndex(u => u.id === scorer.id);
        if (index !== -1) {
          updatedPlayers[index].goles += 1;
        }
      }
    }

    // Double check rosters played
    updatedPlayers.forEach(p => {
      if (p.seleccionId === enc.localId || p.seleccionId === enc.visitanteId) {
        p.partidosJugados += 1;
      }
    });

    setJugadores(updatedPlayers);

    // Apply match changes
    setEncuentros(prev => prev.map(e => e.id === enc.id ? {
      ...e,
      golesLocal: matchScoreLocal,
      golesVisitante: matchScoreVisitante,
      estado: 'Finalizado'
    } : e));

    showNotification(`Simulación rápida completa: ${enc.localId} ${matchScoreLocal} - ${matchScoreVisitante} ${enc.visitanteId}`, 'info');
  };

  // --- STATISTICAL HELPERS FOR THE DASHBOARD ---
  const totalGoals = jugadores.reduce((acc, curr) => acc + curr.goles, 0);
  const totalCardsYellow = jugadores.reduce((acc, curr) => acc + curr.tarjetasAmarillas, 0);
  const totalCardsRed = jugadores.reduce((acc, curr) => acc + curr.tarjetasRojas, 0);
  
  const topScorers = [...jugadores]
    .filter(j => j.goles > 0)
    .sort((a, b) => b.goles - a.goles || b.asistencias - a.asistencias)
    .slice(0, 5);

  const topAssists = [...jugadores]
    .filter(j => j.asistencias > 0)
    .sort((a, b) => b.asistencias - a.asistencias)
    .slice(0, 5);

  // Standings Calculator for Group Stage
  const getGroupStandings = (grupoName: string) => {
    const groupTeamsMap: Record<string, { pts: number; pj: number; pg: number; pe: number; pp: number; gf: number; gc: number }> = {};
    
    // Find all teams playing in this group
    const groupMatches = encuentros.filter(e => e.fase === 'Fase de Grupos' && e.grupo === grupoName);
    const teamIdsInGroup = Array.from(new Set(groupMatches.flatMap(m => [m.localId, m.visitanteId]))) as string[];

    teamIdsInGroup.forEach(id => {
      groupTeamsMap[id] = { pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0 };
    });

    groupMatches.forEach(m => {
      if (m.estado === 'Finalizado' && m.golesLocal !== null && m.golesVisitante !== null) {
        const local = groupTeamsMap[m.localId];
        const visit = groupTeamsMap[m.visitanteId];
        
        if (local && visit) {
          local.pj += 1;
          visit.pj += 1;
          local.gf += m.golesLocal;
          local.gc += m.golesVisitante;
          visit.gf += m.golesVisitante;
          visit.gc += m.golesLocal;

          if (m.golesLocal > m.golesVisitante) {
            local.pg += 1;
            local.pts += 3;
            visit.pp += 1;
          } else if (m.golesLocal < m.golesVisitante) {
            visit.pg += 1;
            visit.pts += 3;
            local.pp += 1;
          } else {
            local.pe += 1;
            visit.pe += 1;
            local.pts += 1;
            visit.pts += 1;
          }
        }
      }
    });

    return Object.entries(groupTeamsMap).map(([id, stats]) => {
      const sName = selecciones.find(sel => sel.id === id)?.nombre || id;
      return { id, nombre: sName, ...stats };
    }).sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf);
  };

  // --- EXPORT STRING COPIER Utility ---
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
    showNotification('Código copiado al portapapeles con éxito.', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-900">
      
      {/* GLOWING AMBIENCE ELEMENT */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[300px] bg-emerald-500/10 blur-[120px] pointer-events-none rounded-full" />

      {/* HEADER BANNER */}
      <header className="relative border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl shadow-inner text-emerald-400">
              <Trophy className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-2xl tracking-tight text-white">MUNDIAL 2026</h1>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono uppercase font-bold py-0.5 px-2 rounded-full border border-emerald-500/30">
                  Estadísticas & Gestión
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Capa de Datos Local &middot; Emulador de Persistencia Java &amp; SQL PostgreSQL
              </p>
            </div>
          </div>

          {/* Polished Navigation Controls */}
          <nav className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-800 rounded-xl">
            <button
              id="nav-dash"
              onClick={() => { setActiveTab('dashboard'); setSearchQuery(''); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-emerald-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Resumen</span>
            </button>

            <button
              id="nav-sel"
              onClick={() => { setActiveTab('selecciones'); setSearchQuery(''); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'selecciones' 
                  ? 'bg-emerald-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Selecciones</span>
            </button>

            <button
              id="nav-jug"
              onClick={() => { setActiveTab('jugadores'); setSearchQuery(''); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'jugadores' 
                  ? 'bg-emerald-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Jugadores</span>
            </button>

            <button
              id="nav-match"
              onClick={() => { setActiveTab('encuentros'); setSearchQuery(''); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'encuentros' 
                  ? 'bg-emerald-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Partidos</span>
            </button>

            <button
              id="nav-export"
              onClick={() => { setActiveTab('export'); setSearchQuery(''); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'export' 
                  ? 'bg-amber-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-[rgb(245,158,11)] hover:bg-slate-900/60'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Código Java &amp; SQL</span>
            </button>
          </nav>

        </div>
      </header>

      {/* SYSTEM NOTIFICATION DRAWER / BAR */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 z-50 max-w-sm w-full"
          >
            <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-2xl backdrop-blur-md ${
              notification.type === 'success' 
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200' 
                : notification.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : 'bg-blue-950/90 border-blue-500/40 text-blue-200'
            }`}>
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-xs font-semibold leading-relaxed">{notification.text}</p>
              </div>
              <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CORE FRAMEWORK CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <AnimatePresence mode="wait">
          
          {/* ==================== TAB 1: DASHBOARD (RESUMEN) ==================== */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
              id="tab-dashboard-content"
            >
              {/* Quick Stat Highlights */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 bg-slate-950/40 border border-slate-800/80 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Selecciones</p>
                    <p className="text-3xl font-display font-bold text-white mt-1">{selecciones.length}</p>
                  </div>
                  <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                    <Trophy className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-6 bg-slate-950/40 border border-slate-800/80 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Plantel Jugadores</p>
                    <p className="text-3xl font-display font-bold text-white mt-1">{jugadores.length}</p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-6 bg-slate-950/40 border border-slate-800/80 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Goles Marcados</p>
                    <p className="text-3xl font-display font-bold text-emerald-400 mt-1">{totalGoals}</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                    <Award className="w-6 h-6 animate-pulse" />
                  </div>
                </div>

                <div className="p-6 bg-slate-950/40 border border-slate-800/80 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Tarjetas Registradas</p>
                    <p className="text-lg font-display text-slate-200 mt-1.5 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-4 bg-amber-400 rounded-sm inline-block" /> {totalCardsYellow}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-4 bg-rose-500 rounded-sm inline-block" /> {totalCardsRed}
                      </span>
                    </p>
                  </div>
                  <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Bento Grid layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Top Statistics Lists (Leaderboard) */}
                <div className="lg:col-span-8 space-y-8">
                  
                  {/* Goleadores y Asistidores */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Goleadores */}
                    <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Award className="w-5 h-5 text-amber-400" />
                        <h3 className="font-display font-bold text-base text-white">Máximos Goleadores</h3>
                      </div>
                      <div className="space-y-3">
                        {topScorers.length > 0 ? (
                          topScorers.map((j, idx) => (
                            <div key={j.id} className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700/60 transition-all">
                              <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                                  idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-900' : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {idx + 1}
                                </span>
                                <div>
                                  <p className="text-xs font-semibold text-white">{j.nombre}</p>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    {selecciones.find(s => s.id === j.seleccionId)?.nombre || j.seleccionId} &middot; #{j.dorsal} {j.posicion}
                                  </p>
                                </div>
                              </div>
                              <span className="text-sm font-display font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                                {j.goles} G
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500 italic py-4 text-center">No hay goles registrados todavía.</p>
                        )}
                      </div>
                    </div>

                    {/* Asistentes */}
                    <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <ArrowLeftRight className="w-5 h-5 text-blue-400" />
                        <h3 className="font-display font-bold text-base text-white">Máximos Asistidores</h3>
                      </div>
                      <div className="space-y-3">
                        {topAssists.length > 0 ? (
                          topAssists.map((j, idx) => (
                            <div key={j.id} className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700/60 transition-all">
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <div>
                                  <p className="text-xs font-semibold text-white">{j.nombre}</p>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    {selecciones.find(s => s.id === j.seleccionId)?.nombre || j.seleccionId} &middot; #{j.dorsal} {j.posicion}
                                  </p>
                                </div>
                              </div>
                              <span className="text-sm font-display font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                                {j.asistencias} A
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500 italic py-4 text-center">No hay asistencias registradas.</p>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* World Cup 2026 Bracket Simulator Block */}
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-emerald-400" />
                        <h3 className="font-display font-bold text-base text-white">Últimos Encuentros y Eliminatorias</h3>
                      </div>
                      <button onClick={() => setActiveTab('encuentros')} className="text-xs text-emerald-400 hover:underline">
                        Ver todos
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {encuentros.slice(0, 4).map(enc => {
                        const local = selecciones.find(s => s.id === enc.localId);
                        const visit = selecciones.find(s => s.id === enc.visitanteId);
                        return (
                          <div key={enc.id} className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl space-y-3">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                              <span className="bg-slate-800 p-1 rounded font-medium">{enc.fase}</span>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{enc.fecha}</span>
                              </div>
                            </div>
                            
                            {/* Score Display Row */}
                            <div className="flex items-center justify-between gap-2 py-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">{enc.localId}</span>
                                <span className="text-xs text-slate-400 truncate max-w-[80px]">{local?.nombre}</span>
                              </div>

                              <div className="flex items-center gap-1 bg-slate-950 py-1 px-3 rounded-lg border border-slate-800">
                                <span className={`text-sm font-display font-bold ${enc.estado === 'Finalizado' ? 'text-white' : 'text-slate-500'}`}>
                                  {enc.golesLocal !== null ? enc.golesLocal : '-'}
                                </span>
                                <span className="text-[10px] text-slate-500 px-0.5">:</span>
                                <span className={`text-sm font-display font-bold ${enc.estado === 'Finalizado' ? 'text-white' : 'text-slate-500'}`}>
                                  {enc.golesVisitante !== null ? enc.golesVisitante : '-'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 justify-end">
                                <span className="text-xs text-slate-400 truncate max-w-[80px]">{visit?.nombre}</span>
                                <span className="font-bold text-sm text-white">{enc.visitanteId}</span>
                              </div>
                            </div>

                            <div className="text-[10px] text-slate-500 flex items-center gap-1 justify-center italic">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">{enc.lugar}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Side: Group standings simulator */}
                <div className="lg:col-span-4 space-y-8">
                  
                  {/* Group Standings Summary */}
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display font-bold text-base text-white">Tabla Grupo A</h3>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Fase de Grupos</span>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="w-full">
                        {/* Table Headers */}
                        <div className="grid grid-cols-12 text-[10px] font-bold text-slate-500 pb-2 border-b border-slate-800 px-2">
                          <span className="col-span-6">SELECCIÓN</span>
                          <span className="col-span-2 text-center">PJ</span>
                          <span className="col-span-2 text-center">DG</span>
                          <span className="col-span-2 text-center text-emerald-400">PTS</span>
                        </div>
                        {/* Standings list */}
                        <div className="divide-y divide-slate-800/60">
                          {getGroupStandings('Grupo A').map((t, idx) => (
                            <div key={t.id} className="grid grid-cols-12 py-2.5 text-xs text-slate-300 items-center px-2">
                              {/* Team Name */}
                              <div className="col-span-6 flex items-center gap-2">
                                <span className={`text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ${
                                  idx < 2 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                                }`}>
                                  {idx + 1}
                                </span>
                                <span className="font-semibold text-white">{t.nombre}</span>
                              </div>
                              <span className="col-span-2 text-center font-mono">{t.pj}</span>
                              <span className={`col-span-2 text-center font-mono text-xs ${t.gf - t.gc >= 0 ? 'text-slate-400' : 'text-rose-400'}`}>
                                {t.gf - t.gc > 0 ? `+${t.gf - t.gc}` : t.gf - t.gc}
                              </span>
                              <span className="col-span-2 text-center font-bold text-white font-mono">{t.pts}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 mt-2">
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          La tabla calcula los puntos y diferencia de gol basados en los encuentros del Grupo A cargados y marcados como <strong>Finalizados</strong>. ¡Prueba a registrar un partido para ver cómo cambia!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* World Cup 2026 Academic context info box */}
                  <div className="bg-gradient-to-br from-indigo-950/40 to-slate-950/40 border border-indigo-500/20 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                      <h3 className="font-display font-medium text-sm text-white">Objetivo Académico (Java &amp; DB)</h3>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Este sistema simula la interfaz de usuario de tu proyecto final de Base de Datos. Utiliza los menús superiores para gestionar selecciones, jugadores, y partidos del Mundial.
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      El módulo de <strong>Código Java &amp; SQL</strong> exporta el script DDL, la conexión de capa JDBC y los métodos DAO correspondientes para tu base de datos relacional.
                    </p>
                    <button 
                      onClick={() => setActiveTab('export')}
                      className="w-full py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-xl text-xs font-semibold border border-indigo-500/30 transition-all flex items-center justify-center gap-1.5"
                    >
                      <SearchCode className="w-3.5 h-3.5" />
                      <span>Ver Código Java Generado</span>
                    </button>
                  </div>

                </div>

              </div>
            </motion.div>
          )}

          {/* ==================== TAB 2: SELECCIONES (CRUD) ==================== */}
          {activeTab === 'selecciones' && (
            <motion.div
              key="selecciones"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
              id="tab-selecciones-content"
            >
              
              {/* Filter controls and add action */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar selección por nombre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white">
                      Limpiar
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <button
                    onClick={() => { setEditingSel(null); setIsSelModalOpen(true); }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold leading-none shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar Selección</span>
                  </button>
                </div>
              </div>

              {/* Grid / List of teams */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {selecciones
                  .filter(s => s.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(s => {
                    const squadCount = jugadores.filter(j => j.seleccionId === s.id).length;
                    return (
                      <div key={s.id} className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 space-y-4 hover:border-slate-700/60 transition-all flex flex-col justify-between">
                        <div>
                          
                          {/* Card Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-display font-bold text-white tracking-widest text-sm text-center">
                                {s.id}
                              </div>
                              <div>
                                <h3 className="font-display font-semibold text-white text-base leading-tight">{s.nombre}</h3>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{s.participaciones} Participaciones mundiales</p>
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex items-center gap-1.5">
                              <button 
                                onClick={() => { setEditingSel(s); setIsSelModalOpen(true); }}
                                className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                                title="Editar Selección"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteSeleccion(s.id, s.nombre)}
                                className="p-1.5 bg-slate-900 border border-slate-800 text-rose-400 hover:bg-rose-500/15 hover:text-rose-200 rounded-lg transition-colors"
                                title="Eliminar Selección"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Stats Divider & Content */}
                          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-900">
                            <div className="p-2.5 bg-slate-900/40 rounded-xl border border-slate-800/40">
                              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Palmares ORO</span>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Trophy className="w-4 h-4 text-amber-400" />
                                <span className="font-display font-extrabold text-sm text-white">{s.oro}</span>
                              </div>
                            </div>

                            <div className="p-2.5 bg-slate-900/40 rounded-xl border border-slate-800/40">
                              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Palmares PLATA</span>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Trophy className="w-4 h-4 text-slate-300" />
                                <span className="font-display font-extrabold text-sm text-white">{s.plata}</span>
                              </div>
                            </div>
                          </div>

                        </div>

                        {/* Footer details */}
                        <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-900">
                          <span className="font-medium">Jugadores registrados:</span>
                          <span className="bg-slate-900 text-emerald-400 font-mono font-extrabold px-2 py-0.5 rounded border border-slate-800">
                            {squadCount}
                          </span>
                        </div>

                      </div>
                    );
                  })}
              </div>

            </motion.div>
          )}

          {/* ==================== TAB 3: JUGADORES (CRUD) ==================== */}
          {activeTab === 'jugadores' && (
            <motion.div
              key="jugadores"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
              id="tab-jugadores-content"
            >
              
              {/* Dynamic Filter Controls */}
              <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search query */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Team filter dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Selección:</span>
                    <select
                      value={teamFilter}
                      onChange={(e) => setTeamFilter(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="ALL">Todas las Selecciones</option>
                      {selecciones.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre} ({s.id})</option>
                      ))}
                    </select>
                  </div>

                  {/* Position filter dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Posición:</span>
                    <select
                      value={posFilter}
                      onChange={(e) => setPosFilter(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="ALL">Cualquier Posición</option>
                      <option value="Portero">Portero</option>
                      <option value="Defensa">Defensa</option>
                      <option value="Centrocampista">Centrocampista</option>
                      <option value="Delantero">Delantero</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                  <span className="text-xs text-slate-400 font-medium">
                    Mostrando{' '}
                    <strong className="text-white">
                      {jugadores.filter(j => 
                        j.nombre.toLowerCase().includes(searchQuery.toLowerCase()) &&
                        (teamFilter === 'ALL' || j.seleccionId === teamFilter) &&
                        (posFilter === 'ALL' || j.posicion === posFilter)
                      ).length}
                    </strong>{' '}
                    jugadores habilitados
                  </span>

                  <button
                    onClick={() => { setEditingJug(null); setIsJugModalOpen(true); }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold leading-none shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar Jugador</span>
                  </button>
                </div>
              </div>

              {/* Responsive Table / Card Layout */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="min-w-full overflow-x-auto">
                  <table className="min-w-full text-xs text-slate-300">
                    <thead className="bg-slate-950 border-b border-slate-800 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                      <tr>
                        <th className="py-3.5 px-6 text-left">Jugador</th>
                        <th className="py-3.5 px-4 text-center">País</th>
                        <th className="py-3.5 px-4 text-center">Edad</th>
                        <th className="py-3.5 px-4 text-center">Partidos</th>
                        <th className="py-3.5 px-4 text-center text-emerald-400 font-display">Goles</th>
                        <th className="py-3.5 px-4 text-center text-indigo-400 font-display">Asist.</th>
                        <th className="py-3.5 px-4 text-center">Amarillas</th>
                        <th className="py-3.5 px-4 text-center">Rojas</th>
                        <th className="py-3.5 px-6 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 font-medium">
                      {jugadores
                        .filter(j => 
                          j.nombre.toLowerCase().includes(searchQuery.toLowerCase()) &&
                          (teamFilter === 'ALL' || j.seleccionId === teamFilter) &&
                          (posFilter === 'ALL' || j.posicion === posFilter)
                        )
                        .map(j => {
                          const associatedTeam = selecciones.find(s => s.id === j.seleccionId);
                          return (
                            <tr key={j.id} className="hover:bg-slate-900/40 transition-colors">
                              <td className="py-3.5 px-6">
                                <div className="flex items-center gap-2.5">
                                  <span className="text-slate-500 font-mono font-bold">#{j.dorsal}</span>
                                  <div>
                                    <p className="text-xs font-semibold text-white">{j.nombre}</p>
                                    <span className="text-[10px] text-slate-500 font-semibold">{j.posicion}</span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                <span className="bg-slate-900 py-1 px-2.5 rounded-lg border border-slate-800 text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                                  {associatedTeam?.nombre || j.seleccionId}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono">{j.edad}</td>
                              
                              <td className="py-3.5 px-4 text-center font-mono">{j.partidosJugados}</td>
                              
                              <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400 text-sm">
                                {j.goles}
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-bold text-indigo-400 text-sm">
                                {j.asistencias}
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                  <span className="w-2 h-3 bg-yellow-400 rounded-sm" /> {j.tarjetasAmarillas}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                                  j.tarjetasRojas > 0 
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold' 
                                    : 'bg-slate-900 text-slate-500'
                                }`}>
                                  <span className={`w-2 h-3 rounded-sm ${j.tarjetasRojas > 0 ? 'bg-rose-500' : 'bg-slate-700'}`} /> {j.tarjetasRojas}
                                </span>
                              </td>

                              <td className="py-3.5 px-6 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => { setEditingJug(j); setIsJugModalOpen(true); }}
                                    className="p-1.5 bg-slate-900 border border-slate-850 text-slate-400 hover:text-white rounded-lg"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteJugador(j.id, j.nombre)}
                                    className="p-1.5 bg-slate-900 border border-slate-850 text-rose-400 hover:bg-rose-500/15 hover:text-rose-200 rounded-lg"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>

                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

            </motion.div>
          )}

          {/* ==================== TAB 4: PARTIDOS / ENCUENTROS (CRUD & SIMULATION) ==================== */}
          {activeTab === 'encuentros' && (
            <motion.div
              key="encuentros"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
              id="tab-encuentros-content"
            >
              
              {/* Filter controls / schedulers */}
              <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Phase Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Etapa:</span>
                    <select
                      value={faseFilter}
                      onChange={(e) => setFaseFilter(e.target.value as any)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="ALL">Todas las Etapas del Torneo</option>
                      <option value="Fase de Grupos">Fase de Grupos</option>
                      <option value="Dieciseisavos">Dieciseisavos</option>
                      <option value="Octavos de Final">Octavos de Final</option>
                      <option value="Cuartos de Final">Cuartos de Final</option>
                      <option value="Semifinal">Semifinal</option>
                      <option value="Final">Final</option>
                    </select>
                  </div>

                  {/* Status Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Estado:</span>
                    <select
                      value={estadoFilter}
                      onChange={(e) => setEstadoFilter(e.target.value as any)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="ALL">Ver Todos</option>
                      <option value="Pendiente">Pendientes / Por Jugar</option>
                      <option value="Finalizado">Finalizados / Con Resultados</option>
                    </select>
                  </div>

                </div>

                <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                  <span className="text-xs text-slate-400 font-medium">
                    Filtros aplicados &middot; Matches encontrados:{' '}
                    <strong className="text-white">
                      {encuentros.filter(e => 
                        (faseFilter === 'ALL' || e.fase === faseFilter) &&
                        (estadoFilter === 'ALL' || e.estado === estadoFilter)
                      ).length}
                    </strong>
                  </span>

                  <button
                    onClick={() => { setEditingEnc(null); setIsEncModalOpen(true); }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold leading-none shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Programar Encuentro</span>
                  </button>
                </div>
              </div>

              {/* Match Schedules Display Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {encuentros
                  .filter(e => 
                    (faseFilter === 'ALL' || e.fase === faseFilter) &&
                    (estadoFilter === 'ALL' || e.estado === estadoFilter)
                  )
                  .map(e => {
                    const local = selecciones.find(s => s.id === e.localId);
                    const visit = selecciones.find(s => s.id === e.visitanteId);
                    return (
                      <div key={e.id} className="bg-slate-950/40 border border-slate-800 hover:border-slate-700/60 transition-all rounded-2xl p-6 flex flex-col justify-between gap-4">
                        
                        {/* Header metadata row */}
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800/80 text-[10px] font-mono font-bold text-slate-400">
                            {e.fase} {e.grupo ? `| ${e.grupo}` : ''}
                          </span>
                          
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => { setEditingEnc(e); setIsEncModalOpen(true); }}
                              className="p-1 px-2 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-400 hover:text-white rounded-lg text-[10px] font-semibold transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteEncuentro(e.id)}
                              className="p-1.5 border border-slate-800 hover:border-rose-400 hover:bg-rose-500/15 text-slate-400 hover:text-rose-200 rounded-lg transition-colors"
                              title="Eliminar Encuentro"
                            >
                              <Trash2 className="w-3" />
                            </button>
                          </div>
                        </div>

                        {/* Interactive Match Visual Row */}
                        <div className="flex items-center justify-between gap-4 py-2 bg-slate-900/30 p-4 rounded-xl border border-slate-900">
                          
                          {/* Local Team */}
                          <div className="flex-1 text-center space-y-1">
                            <span className="text-white font-display font-extrabold text-xl tracking-tight block">
                              {e.localId}
                            </span>
                            <span className="text-[11px] text-slate-400 truncate max-w-[120px] block mx-auto">
                              {local?.nombre || 'Indefinido'}
                            </span>
                          </div>

                          {/* Scores box */}
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-850 shadow-inner">
                              <span className="text-xl font-display font-black text-white px-1">
                                {e.golesLocal !== null ? e.golesLocal : '-'}
                              </span>
                              <span className="text-xs text-slate-500 font-bold">:</span>
                              <span className="text-xl font-display font-black text-white px-1">
                                {e.golesVisitante !== null ? e.golesVisitante : '-'}
                              </span>
                            </div>
                            
                            <span className={`text-[9px] font-bold uppercase tracking-wider mt-2 px-2 py-0.5 rounded-full ${
                              e.estado === 'Finalizado' 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {e.estado}
                            </span>
                          </div>

                          {/* Visitante Team */}
                          <div className="flex-1 text-center space-y-1">
                            <span className="text-white font-display font-extrabold text-xl tracking-tight block">
                              {e.visitanteId}
                            </span>
                            <span className="text-[11px] text-slate-400 truncate max-w-[120px] block mx-auto">
                              {visit?.nombre || 'Indefinido'}
                            </span>
                          </div>

                        </div>

                        {/* Footer details + Simulators */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-900 pt-3 gap-3">
                          <div className="text-[10px] text-slate-400 font-mono space-y-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>{e.lugar}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>{e.fecha} &middot; {e.hora} HS</span>
                            </div>
                          </div>

                          {/* Simulation Control block */}
                          {e.estado === 'Pendiente' ? (
                            <div className="flex items-center gap-2">
                              {/* Simulate Speed results */}
                              <button
                                onClick={() => handleQuickSimulate(e)}
                                className="bg-slate-900 hover:bg-slate-850 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                              >
                                <Zap className="w-3 h-3 text-amber-400" />
                                <span>Simular Rápido</span>
                              </button>
                              
                              {/* Open detail manual scorer */}
                              <button
                                onClick={() => handleOpenScoreReporter(e)}
                                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-colors flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Cargar Resultado</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic flex items-center gap-1 sm:self-center">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>Estadísticas aplicadas</span>
                            </span>
                          )}

                        </div>

                      </div>
                    );
                  })}
              </div>

            </motion.div>
          )}

          {/* ==================== TAB 5: EXPORT (JAVA & PostgreSQL CODE) ==================== */}
          {activeTab === 'export' && (
            <motion.div
              key="export"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
              id="tab-export-content"
            >
              
              {/* Header Box describing why this fits their exact curriculum objective */}
              <div className="p-6 bg-gradient-to-r from-amber-950/40 via-slate-950/40 to-slate-950/40 border border-amber-500/20 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/30">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-display font-medium text-lg text-white">Generador de Código de Persistencia (Java &amp; Base de Datos)</h2>
                    <p className="text-xs text-slate-400">
                      Cubre los requerimientos académicos completos integrando SQL relacional robusto con código estructurado JDBC en Java standard.
                    </p>
                  </div>
                </div>
              </div>

              {/* Subtabs selective filter */}
              <div className="flex flex-col md:flex-row gap-6">
                
                {/* Left selector menu */}
                <div className="w-full md:w-64 shrink-0 space-y-1 bg-slate-950/50 p-2 border border-slate-800 rounded-xl max-h-min">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-2.5 py-1.5">Estructuras</p>
                  
                  <button
                    onClick={() => setExportSubTab('sql')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                      exportSubTab === 'sql' 
                        ? 'bg-amber-500/25 text-amber-300 border border-amber-500/30' 
                        : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-100'
                    }`}
                  >
                    <span>Script SQL DDL &amp; Consultas</span>
                    <span className="font-mono text-[9px] bg-slate-900 py-0.5 px-1.5 rounded text-slate-550 border border-slate-800">.sql</span>
                  </button>

                  <button
                    onClick={() => setExportSubTab('pojo')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                      exportSubTab === 'pojo' 
                        ? 'bg-amber-500/25 text-amber-300 border border-amber-500/30' 
                        : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-100'
                    }`}
                  >
                    <span>Clases Modelo POJO (Java)</span>
                    <span className="font-mono text-[9px] bg-slate-900 py-0.5 px-1.5 rounded text-slate-550 border border-slate-800">.java</span>
                  </button>

                  <button
                    onClick={() => setExportSubTab('conn')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                      exportSubTab === 'conn' 
                        ? 'bg-amber-500/25 text-amber-300 border border-amber-500/30' 
                        : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-100'
                    }`}
                  >
                    <span>Conexión JDBC (Java)</span>
                    <span className="font-mono text-[9px] bg-slate-900 py-0.5 px-1.5 rounded text-slate-550 border border-slate-800">.java</span>
                  </button>

                  <button
                    onClick={() => setExportSubTab('dao')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                      exportSubTab === 'dao' 
                        ? 'bg-amber-500/25 text-amber-300 border border-amber-500/30' 
                        : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-100'
                    }`}
                  >
                    <span>Patrón DAO (JDBC CRUD)</span>
                    <span className="font-mono text-[9px] bg-slate-900 py-0.5 px-1.5 rounded text-slate-550 border border-slate-800">.java</span>
                  </button>
                </div>

                {/* Main Code Viewport */}
                <div className="flex-1 bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between">
                  
                  {/* Top copy banner */}
                  <div className="bg-slate-950 p-4 border-b border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {exportSubTab === 'sql' ? 'schema_mundial2026.sql' : exportSubTab === 'pojo' ? 'Seleccion.java y Jugador.java' : exportSubTab === 'conn' ? 'ConexionBD.java' : 'SeleccionDAO.java'}
                      </span>
                    </div>

                    <button
                      onClick={() => copyToClipboard(
                        exportSubTab === 'sql' 
                          ? JAVA_SQL_DUMP.sqlSchema 
                          : exportSubTab === 'pojo' 
                          ? JAVA_SQL_DUMP.modelsJava 
                          : exportSubTab === 'conn' 
                          ? JAVA_SQL_DUMP.conexionJava 
                          : JAVA_SQL_DUMP.daoJava
                      )}
                      className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 text-slate-350 hover:text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 hover:border-slate-700"
                    >
                      {copiedText ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Código</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Code Block viewer with syntax highlighting emulation */}
                  <pre className="p-6 overflow-auto text-xs font-mono text-slate-300 bg-slate-950/80 max-h-[500px] leading-relaxed">
                    <code>
                      {exportSubTab === 'sql' && JAVA_SQL_DUMP.sqlSchema}
                      {exportSubTab === 'pojo' && JAVA_SQL_DUMP.modelsJava}
                      {exportSubTab === 'conn' && JAVA_SQL_DUMP.conexionJava}
                      {exportSubTab === 'dao' && JAVA_SQL_DUMP.daoJava}
                    </code>
                  </pre>

                  {/* Summary/Tip footer */}
                  <div className="p-4 bg-slate-950 border-t border-slate-850/80 text-[11px] text-slate-400 leading-relaxed italic">
                    {exportSubTab === 'sql' && "Este script crea las llaves primarias, foráneas con integridad referencial CASCADE y restricciones CHECK de validación en tiempo de servidor. Además, contiene queries agregadas listas para rendir."}
                    {exportSubTab === 'pojo' && "Clases encapsuladas POJO con getters, setters y representación toString. Modela perfectamente la información de las selecciones de fútbol y los jugadores."}
                    {exportSubTab === 'conn' && "Utility class para establecer y cerrar la comunicación con PostgreSQL o MySQL. Implementa el patrón Singleton básico para evitar hilos redundantes de conexión."}
                    {exportSubTab === 'dao' && "Data Access Object completo implementando transacciones preparadas (PreparedStatement) a prueba de inyecciones SQL que soportan Altas, Bajas y Consultas."}
                  </div>

                </div>

              </div>
              
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="mt-16 border-t border-slate-800 bg-slate-950/60 py-6 text-center text-slate-500 text-[11px] relative">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-mono">Mundial Copa del Mundo 2026 Estadísticas &copy; Universidad de Ingeniería Tecnológica de Java &amp; Base de Datos</p>
        </div>
      </footer>

      {/* ========================================================== */}
      {/* ==================== MODALS & FORMS ==================== */}
      {/* ========================================================== */}

      {/* MODAL 1: SELECCIONES CRUD */}
      <AnimatePresence>
        {isSelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl max-w-md w-full"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                <h3 className="font-display font-bold text-base text-white">
                  {editingSel ? 'Editar Selección Nacional' : 'Agregar Nueva Selección'}
                </h3>
                <button onClick={() => { setIsSelModalOpen(false); setEditingSel(null); }} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSaveSeleccion} className="p-6 space-y-4">
                
                {/* ID Input */}
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Código ISO 3 Letras (Fijo)</label>
                  <input
                    type="text"
                    name="id"
                    defaultValue={editingSel?.id || ''}
                    disabled={!!editingSel}
                    placeholder="e.g. ARG"
                    maxLength={3}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50 uppercase font-mono"
                    required
                  />
                </div>

                {/* Name Input */}
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nombre de Selección</label>
                  <input
                    type="text"
                    name="nombre"
                    defaultValue={editingSel?.nombre || ''}
                    placeholder="e.g. Argentina"
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                {/* Numerical rows layout */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Mundiales Oro</label>
                    <input
                      type="number"
                      name="oro"
                      min={0}
                      defaultValue={editingSel?.oro || 0}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Mundiales Plata</label>
                    <input
                      type="number"
                      name="plata"
                      min={0}
                      defaultValue={editingSel?.plata || 0}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Participac.</label>
                    <input
                      type="number"
                      name="participaciones"
                      min={1}
                      defaultValue={editingSel?.participaciones || 1}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-850 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setIsSelModalOpen(false); setEditingSel(null); }}
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-450 text-slate-950 rounded-xl text-xs font-bold leading-none"
                  >
                    Guardar Cambios
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: JUGADORES CRUD */}
      <AnimatePresence>
        {isJugModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col justify-between"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                <h3 className="font-display font-bold text-base text-white">
                  {editingJug ? 'Editar Estadísticas de Jugador' : 'Cargar Nuevo Jugador'}
                </h3>
                <button onClick={() => { setIsJugModalOpen(false); setEditingJug(null); }} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveJugador} className="overflow-y-auto p-6 space-y-4">
                
                {/* Row 1: Name and Team ID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      name="nombre"
                      defaultValue={editingJug?.nombre || ''}
                      placeholder="e.g. Alexis Mac Allister"
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Selección Representada</label>
                    <select
                      name="seleccionId"
                      defaultValue={editingJug?.seleccionId || ''}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      required
                    >
                      <option value="">-- Seleccionar Selección --</option>
                      {selecciones.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre} ({s.id})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Age, position, shirt number */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Edad</label>
                    <input
                      type="number"
                      name="edad"
                      min={15}
                      max={50}
                      defaultValue={editingJug?.edad || 24}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Dorsal</label>
                    <input
                      type="number"
                      name="dorsal"
                      min={1}
                      max={99}
                      defaultValue={editingJug?.dorsal || 10}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Posición</label>
                    <select
                      name="posicion"
                      defaultValue={editingJug?.posicion || 'Medicampista'}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                    >
                      <option value="Portero">Portero</option>
                      <option value="Defensa">Defensa</option>
                      <option value="Centrocampista">Centrocampista</option>
                      <option value="Delantero">Delantero</option>
                    </select>
                  </div>
                </div>

                {/* Divider Title for Stats */}
                <div className="pt-3 border-t border-slate-850">
                  <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Estadísticas Estadísticas (Mundial 2026)</h4>
                </div>

                {/* Row 3: Goals, Assists, Match Played */}
                <div className="grid grid-cols-3 gap-3">
                  
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Partidos Jugados</label>
                    <input
                      type="number"
                      name="partidosJugados"
                      min={0}
                      defaultValue={editingJug?.partidosJugados || 0}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Goles Totales</label>
                    <input
                      type="number"
                      name="goles"
                      min={0}
                      defaultValue={editingJug?.goles || 0}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Asistencias</label>
                    <input
                      type="number"
                      name="asistencias"
                      min={0}
                      defaultValue={editingJug?.asistencias || 0}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                </div>

                {/* Row 4: Yellow / Red cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Tarjetas Amarillas</label>
                    <input
                      type="number"
                      name="tarjetasAmarillas"
                      min={0}
                      defaultValue={editingJug?.tarjetasAmarillas || 0}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Tarjetas Rojas</label>
                    <input
                      type="number"
                      name="tarjetasRojas"
                      min={0}
                      defaultValue={editingJug?.tarjetasRojas || 0}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                {/* Buttons controls */}
                <div className="pt-4 border-t border-slate-850 flex items-center justify-end gap-3 sticky bottom-0 bg-slate-900 pb-2">
                  <button
                    type="button"
                    onClick={() => { setIsJugModalOpen(false); setEditingJug(null); }}
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-450 text-slate-950 rounded-xl text-xs font-bold leading-none"
                  >
                    Guardar Jugador
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: ENCUENTROS CRUD */}
      <AnimatePresence>
        {isEncModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl max-w-lg w-full"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                <h3 className="font-display font-bold text-base text-white">
                  {editingEnc ? 'Editar Configuración del Encuentro' : 'Programar Encuentro del Mundial'}
                </h3>
                <button onClick={() => { setIsEncModalOpen(false); setEditingEnc(null); }} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEncuentro} className="p-6 space-y-4">
                
                {/* Teams Rows */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Selección Local</label>
                    <select
                      name="localId"
                      defaultValue={editingEnc?.localId || ''}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                      required
                    >
                      <option value="">-- Seleccionar --</option>
                      {selecciones.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre} ({s.id})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Selección Visitante</label>
                    <select
                      name="visitanteId"
                      defaultValue={editingEnc?.visitanteId || ''}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                      required
                    >
                      <option value="">-- Seleccionar --</option>
                      {selecciones.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre} ({s.id})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Score Input block (Only shown in detail editing for direct override if necessary) */}
                {editingEnc && (
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-3">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Registrar Marcador Directo</span>
                    
                    <div className="grid grid-cols-3 gap-3 items-center">
                      <input
                        type="number"
                        name="golesLocal"
                        placeholder="Goles Local"
                        min={0}
                        defaultValue={editingEnc.golesLocal !== null ? editingEnc.golesLocal : ''}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-center text-xs text-white font-mono"
                      />
                      <span className="text-center text-slate-500 text-xs font-semibold">Cargar Marcador</span>
                      <input
                        type="number"
                        name="golesVisitante"
                        placeholder="Goles Visitante"
                        min={0}
                        defaultValue={editingEnc.golesVisitante !== null ? editingEnc.golesVisitante : ''}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-center text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-1">Estado de Juego</label>
                      <select
                        name="estado"
                        defaultValue={editingEnc.estado}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Finalizado">Finalizado</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Stage Phase */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Etapa eliminatoria</label>
                    <select
                      name="fase"
                      defaultValue={editingEnc?.fase || 'Fase de Grupos'}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white"
                    >
                      <option value="Fase de Grupos">Fase de Grupos</option>
                      <option value="Dieciseisavos">Dieciseisavos</option>
                      <option value="Octavos de Final">Octavos de Final</option>
                      <option value="Cuartos de Final">Cuartos de Final</option>
                      <option value="Semifinal">Semifinal</option>
                      <option value="Final">Final</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Grupo (Opcional)</label>
                    <input
                      type="text"
                      name="grupo"
                      placeholder="e.g. Grupo A"
                      defaultValue={editingEnc?.grupo || ''}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Timing & Stadium */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Fecha programada</label>
                    <input
                      type="date"
                      name="fecha"
                      defaultValue={editingEnc?.fecha || '2026-06-15'}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-white font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Hora de juego</label>
                    <input
                      type="time"
                      name="hora"
                      defaultValue={editingEnc?.hora || '19:30'}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-white font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Estadio y ubicación (Lugar)</label>
                  <input
                    type="text"
                    name="lugar"
                    placeholder="e.g. MetLife Stadium, New York"
                    defaultValue={editingEnc?.lugar || 'MetLife Stadium, NY/NJ'}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="pt-4 border-t border-slate-850 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setIsEncModalOpen(false); setEditingEnc(null); }}
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-450 text-slate-950 rounded-xl text-xs font-bold leading-none"
                  >
                    Programar
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: INTERACTIVE SCORE REPORTERS WITH GOAL ASSIGNMENT */}
      <AnimatePresence>
        {isScoreModalOpen && closingEnc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl max-w-xl w-full max-h-[85vh] flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-800 bg-slate-950/40">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-base text-white">Cargar Marcador &amp; Goleadores del Partido</h3>
                  <button onClick={() => { setIsScoreModalOpen(false); setClosingEnc(null); }} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono tracking-wider">
                  Copa del Mundo 2026 &middot; {closingEnc.fase}
                </p>
              </div>

              {/* Scorer Config */}
              <main className="overflow-y-auto p-6 space-y-6">
                
                {/* Inputs for Match Scores */}
                <div className="flex items-center justify-center gap-6 p-4 bg-slate-950/50 rounded-2xl border border-slate-850">
                  
                  {/* Local Team Block */}
                  <div className="text-center space-y-2">
                    <span className="font-display font-black text-2xl text-white tracking-widest block">{closingEnc.localId}</span>
                    <input
                      type="number"
                      min={0}
                      value={scoreLocal}
                      onChange={(e) => setScoreLocal(Math.max(0, Number(e.target.value)))}
                      className="w-16 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-center text-lg font-bold text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <span className="text-slate-500 font-extrabold text-xl py-4 inline-block">:</span>

                  {/* Visitante Team Block */}
                  <div className="text-center space-y-2">
                    <span className="font-display font-black text-2xl text-white tracking-widest block">{closingEnc.visitanteId}</span>
                    <input
                      type="number"
                      min={0}
                      value={scoreVisitante}
                      onChange={(e) => setScoreVisitante(Math.max(0, Number(e.target.value)))}
                      className="w-16 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-center text-lg font-bold text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                </div>

                {/* Subtitle Assign Scorers */}
                {(scoreLocal > 0 || scoreVisitante > 0) && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-bold text-emerald-450 uppercase tracking-wider">Asignación de Goles a Jugadores</h4>
                      <span className="text-[10px] text-slate-400 font-semibold italic">
                        Asignados: {goalScorers.reduce((acc, curr) => acc + curr.qty, 0)} de {scoreLocal + scoreVisitante} declarados
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Local Roster scorers */}
                      {scoreLocal > 0 && (
                        <div className="space-y-2 p-3 bg-slate-950/30 border border-slate-850/80 rounded-xl">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pb-1.5 border-b border-slate-850/50">
                            Goleadores de {closingEnc.localId}
                          </p>
                          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                            {jugadores.filter(j => j.seleccionId === closingEnc.localId && j.posicion !== 'Portero').map(j => {
                              const qtyRecord = goalScorers.find(gs => gs.id === j.id)?.qty || 0;
                              return (
                                <div key={j.id} className="flex items-center justify-between gap-2 text-xs bg-slate-900/40 p-2 rounded border border-slate-850">
                                  <span className="truncate text-slate-300 font-medium">{j.nombre}</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleDecrementScorer(j.id)}
                                      className="w-5 h-5 bg-slate-800 hover:bg-slate-700 rounded text-center flex items-center justify-center font-bold text-xs"
                                    >
                                      -
                                    </button>
                                    <span className="w-5 text-center font-mono font-bold text-emerald-400">{qtyRecord}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleIncrementScorer(j.id)}
                                      className="w-5 h-5 bg-slate-800 hover:bg-slate-700 rounded text-center flex items-center justify-center font-bold text-xs"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Visitante roster scorers */}
                      {scoreVisitante > 0 && (
                        <div className="space-y-2 p-3 bg-slate-950/30 border border-slate-850/80 rounded-xl">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pb-1.5 border-b border-slate-850/50">
                            Goleadores de {closingEnc.visitanteId}
                          </p>
                          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                            {jugadores.filter(j => j.seleccionId === closingEnc.visitanteId && j.posicion !== 'Portero').map(j => {
                              const qtyRecord = goalScorers.find(gs => gs.id === j.id)?.qty || 0;
                              return (
                                <div key={j.id} className="flex items-center justify-between gap-2 text-xs bg-slate-900/40 p-2 rounded border border-slate-850">
                                  <span className="truncate text-slate-300 font-medium">{j.nombre}</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleDecrementScorer(j.id)}
                                      className="w-5 h-5 bg-slate-800 hover:bg-slate-700 rounded text-center flex items-center justify-center font-bold text-xs"
                                    >
                                      -
                                    </button>
                                    <span className="w-5 text-center font-mono font-bold text-emerald-400">{qtyRecord}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleIncrementScorer(j.id)}
                                      className="w-5 h-5 bg-slate-800 hover:bg-slate-700 rounded text-center flex items-center justify-center font-bold text-xs"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}

              </main>

              {/* Bottom buttons controls */}
              <div className="p-6 border-t border-slate-800 bg-slate-950/30 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsScoreModalOpen(false); setClosingEnc(null); }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApplyMatchResults}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-450 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md"
                >
                  <Check className="w-4 h-4" />
                  <span>Publicar Resultado Oficial</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
