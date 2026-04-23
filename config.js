// ============================================================
// config.js — Configuración global FlotaOps
// ============================================================
const SUPABASE_URL = 'https://ivwewaqlxnwrmexdfyyi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2d2V3YXFseG53cm1leGRmeXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzAxOTQsImV4cCI6MjA5MjU0NjE5NH0.Q6vHGHiBBFdmH9Fhqtef-fci9z45nIHdtfly-UzLjFk';

const REGIONALES = [
  { codigo: 'R1',  nombre: 'R1 - Pereira' },
  { codigo: 'R3',  nombre: 'R3 - Cota' },
  { codigo: 'R6',  nombre: 'R6 - Cereté' },
  { codigo: 'R8',  nombre: 'R8 - Palmira' },
  { codigo: 'R13', nombre: 'R13 - Villavicencio' },
];

const ESTADOS_VH = {
  disponible:    { label: 'Disponible',    color: '#639922', bg: '#EAF3DE' },
  taller_propio: { label: 'Taller propio', color: '#854F0B', bg: '#FAEEDA' },
  concesionario: { label: 'Concesionario', color: '#185FA5', bg: '#E6F1FB' },
  en_patios:     { label: 'En patios',     color: '#854F0B', bg: '#FAEEDA' },
  siniestro:     { label: 'Siniestro',     color: '#A32D2D', bg: '#FCEBEB' },
  inactivo:      { label: 'Inactivo',      color: '#5F5E5A', bg: '#F1EFE8' },
};

const TIPOS_TALLER = {
  taller_propio: 'Taller propio',
  concesionario: 'Concesionario',
  patios:        'Patios',
  siniestro:     'Siniestro',
};
