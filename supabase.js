// ============================================================
// supabase.js — Cliente y helpers FlotaOps
// ============================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL     = 'https://ivwewaqlxnwrmexdfyyi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2d2V3YXFseG53cm1leGRmeXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzAxOTQsImV4cCI6MjA5MjU0NjE5NH0.Q6vHGHiBBFdmH9Fhqtef-fci9z45nIHdtfly-UzLjFk';

export const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Vehículos ──────────────────────────────────────────────
export async function getVehiculos(regionalId = null) {
  let q = db.from('vehiculos').select('*, regionales(nombre)').eq('activo', true).order('placa');
  if (regionalId) q = q.eq('regional_id', regionalId);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function updateVehiculoEstado(id, estado) {
  const { error } = await db.from('vehiculos').update({ estado, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

// ── Eventos de mantenimiento ───────────────────────────────
export async function getEventosActivos(regionalId = null) {
  let q = db.from('eventos_mantenimiento')
    .select(`*, vehiculos(id, placa, tipo, regional_id, regionales(nombre)),
             talleres(nombre, tipo), tipos_mantenimiento(nombre, categoria)`)
    .eq('estado', 'en_proceso')
    .order('fecha_entrada', { ascending: true });
  if (regionalId) q = q.eq('regional_id', regionalId);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function getHistorial(filtros = {}) {
  let q = db.from('eventos_mantenimiento')
    .select(`*, vehiculos(id, placa, tipo, regionales(nombre)),
             talleres(nombre, tipo), tipos_mantenimiento(nombre, categoria)`)
    .order('fecha_entrada', { ascending: false });
  if (filtros.regionalId) q = q.eq('regional_id', filtros.regionalId);
  if (filtros.desde)      q = q.gte('fecha_entrada', filtros.desde);
  if (filtros.hasta)      q = q.lte('fecha_entrada', filtros.hasta);
  if (filtros.tipo)       q = q.eq('tipo', filtros.tipo);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function getHistorialVehiculo(vehiculoId) {
  const { data, error } = await db.from('eventos_mantenimiento')
    .select('*, talleres(nombre, tipo), tipos_mantenimiento(nombre)')
    .eq('vehiculo_id', vehiculoId)
    .order('fecha_entrada', { ascending: false });
  if (error) throw error;
  return data;
}

export async function crearEvento(evento) {
  const { data, error } = await db.from('eventos_mantenimiento').insert(evento).select().single();
  if (error) throw error;
  await updateVehiculoEstado(evento.vehiculo_id, evento.origen);
  return data;
}

export async function registrarRetorno(eventoId, vehiculoId, campos) {
  const { error } = await db.from('eventos_mantenimiento')
    .update({ ...campos, estado: 'completado', updated_at: new Date().toISOString() })
    .eq('id', eventoId);
  if (error) throw error;
  await updateVehiculoEstado(vehiculoId, 'disponible');
}

// ── Alertas ────────────────────────────────────────────────
export async function getAlertasActivas(regionalId = null) {
  let q = db.from('alertas')
    .select(`*, vehiculos(id, placa, tipo, km_actuales, regionales(nombre)),
             tipos_mantenimiento(nombre, categoria)`)
    .in('estado', ['activa', 'proxima', 'vencida'])
    .order('fecha_limite', { ascending: true, nullsFirst: false });
  if (regionalId) q = q.eq('regional_id', regionalId);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

// ── Checklists ─────────────────────────────────────────────
export async function getChecklistsHoy(regionalId = null) {
  const hoy = new Date().toISOString().split('T')[0];
  let q = db.from('checklists')
    .select('*, vehiculos(placa, tipo)')
    .eq('fecha', hoy);
  if (regionalId) q = q.eq('regional_id', regionalId);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function crearChecklist(checklist) {
  const { data, error } = await db.from('checklists').insert(checklist).select().single();
  if (error) throw error;
  return data;
}

// ── Catálogos ──────────────────────────────────────────────
export async function getRegionales() {
  const { data, error } = await db.from('regionales').select('*').eq('activa', true).order('nombre');
  if (error) throw error;
  return data;
}

export async function getTalleres() {
  const { data, error } = await db.from('talleres').select('*').eq('activo', true).order('nombre');
  if (error) throw error;
  return data;
}

export async function getTiposMantenimiento() {
  const { data, error } = await db.from('tipos_mantenimiento').select('*').eq('activo', true).order('nombre');
  if (error) throw error;
  return data;
}

// ── KPIs ───────────────────────────────────────────────────
export async function getKPIs(regionalId = null) {
  let q = db.from('vehiculos').select('id, estado').eq('activo', true);
  if (regionalId) q = q.eq('regional_id', regionalId);
  const { data: vhs, error } = await q;
  if (error) throw error;

  const total       = vhs.length;
  const disponibles = vhs.filter(v => v.estado === 'disponible').length;
  const fuera       = total - disponibles;
  const pct         = total ? Math.round(disponibles * 100 / total) : 0;

  const hace30 = new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0];
  let qe = db.from('eventos_mantenimiento')
    .select('dias_en_taller').eq('estado', 'completado').gte('fecha_salida', hace30);
  if (regionalId) qe = qe.eq('regional_id', regionalId);
  const { data: evs } = await qe;
  const diasPromedio = evs?.length
    ? Math.round(evs.reduce((s, e) => s + (e.dias_en_taller || 0), 0) / evs.length * 10) / 10
    : 0;

  return { total, disponibles, fuera, pct, diasPromedio };
}

// ── KPIs por regional (para gerente) ──────────────────────
export async function getKPIsPorRegional() {
  const { data: vhs, error } = await db.from('vehiculos')
    .select('estado, regional_id, regionales(nombre)')
    .eq('activo', true);
  if (error) throw error;

  const map = {};
  for (const v of vhs) {
    const key  = v.regional_id;
    const nom  = v.regionales?.nombre || key;
    if (!map[key]) map[key] = { nombre: nom, total: 0, disponibles: 0 };
    map[key].total++;
    if (v.estado === 'disponible') map[key].disponibles++;
  }
  return Object.values(map).map(r => ({
    ...r,
    fuera: r.total - r.disponibles,
    pct: r.total ? Math.round(r.disponibles * 100 / r.total) : 0,
  })).sort((a, b) => a.nombre.localeCompare(b.nombre));
}

// ── Helpers UI ─────────────────────────────────────────────
export function diasFuera(fechaEntrada) {
  const hoy     = new Date(); hoy.setHours(0, 0, 0, 0);
  const entrada = new Date(fechaEntrada + 'T00:00:00');
  return Math.max(0, Math.floor((hoy - entrada) / 86400000));
}

export function colorDias(dias) {
  if (dias >= 7) return 'dias-crit';
  if (dias >= 3) return 'dias-warn';
  return 'dias-ok';
}

export function urgenciaAlerta(alerta) {
  const hoy = new Date().toISOString().split('T')[0];
  if (alerta.tipo_alerta === 'por_fecha') {
    if (!alerta.fecha_limite) return 'programada';
    if (alerta.fecha_limite < hoy) return 'vencida';
    const diff = Math.ceil((new Date(alerta.fecha_limite) - new Date()) / 86400000);
    if (diff <= (alerta.anticipacion_dias || 15)) return 'proxima';
  }
  if (alerta.tipo_alerta === 'por_km') {
    const restantes = (alerta.km_limite || 0) - (alerta.vehiculos?.km_actuales || 0);
    if (restantes <= (alerta.anticipacion_km || 500)) return 'proxima_km';
  }
  return 'programada';
}

export function badgeUrgencia(urg) {
  const m = {
    vencida:    '<span class="badge badge-red">Vencida</span>',
    proxima:    '<span class="badge badge-amber">Próxima</span>',
    proxima_km: '<span class="badge badge-amber">Próx. km</span>',
    programada: '<span class="badge badge-gray">Programada</span>',
  };
  return m[urg] || m.programada;
}

export function toast(msg, tipo = 'ok') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.background = tipo === 'error' ? '#A32D2D' : '#1a1a18';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

export function fmtFecha(iso) {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-CO',
    { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtMoneda(val) {
  if (!val && val !== 0) return '—';
  return '$' + Number(val).toLocaleString('es-CO');
}
