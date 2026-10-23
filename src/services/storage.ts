import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MesFinanciero,
  Movimiento,
  MetaAhorro,
  UserProfile,
  Suscripcion,
  PresupuestoCategoria,
  DeudaItem,
  FabPosition,
  PrivacySectionsConfig
} from '../types';

export {
  MesFinanciero,
  Movimiento,
  MetaAhorro,
  UserProfile,
  Suscripcion,
  PresupuestoCategoria,
  DeudaItem,
  FabPosition,
  PrivacySectionsConfig
};

const STORAGE_KEY_MONTHS = '@contamepues_finanzas_months_v3';
const STORAGE_KEY_ACTIVE_MONTH = '@contamepues_finanzas_active_month_v3';
const STORAGE_KEY_THEME = '@contamepues_finanzas_theme_v2';
const STORAGE_KEY_USER_PROFILE = '@contamepues_finanzas_user_profile_v2';
const STORAGE_KEY_USERS_DB = '@contamepues_finanzas_users_db_v2';
const STORAGE_KEY_FIRST_LAUNCH = '@contamepues_finanzas_first_launch_v3';

export const STORAGE_KEY_PRIVACY = '@contamepues_finanzas_privacy_mode_v1';
export const STORAGE_KEY_PRIVACY_SECTIONS = '@contamepues_finanzas_privacy_sections_v2';

export const DEFAULT_PRIVACY_SECTIONS: PrivacySectionsConfig = {
  disponible: false,
  ingresos: false,
  compromisos: false,
  metas: false
};

export const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export async function getStoredPrivacySections(): Promise<PrivacySectionsConfig> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_PRIVACY_SECTIONS);
    if (!raw) return DEFAULT_PRIVACY_SECTIONS;
    const parsed = JSON.parse(raw);
    return {
      disponible: !!parsed.disponible,
      ingresos: !!parsed.ingresos,
      compromisos: !!parsed.compromisos,
      metas: !!parsed.metas
    };
  } catch {
    return DEFAULT_PRIVACY_SECTIONS;
  }
}

export async function setStoredPrivacySections(config: PrivacySectionsConfig): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_PRIVACY_SECTIONS, JSON.stringify(config));
  } catch {}
}

export async function getStoredPrivacyMode(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEY_PRIVACY);
    return val === 'true';
  } catch {
    return false;
  }
}

export async function setStoredPrivacyMode(val: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_PRIVACY, val ? 'true' : 'false');
  } catch {}
}

export function getMonthYearDisplay(date: Date = new Date()): string {
  const m = MESES_ES[date.getMonth()];
  const y = date.getFullYear();
  return `${m} ${y}`;
}

export function cleanMonthName(raw: string): string {
  if (!raw) return getMonthYearDisplay();
  // Elimina cualquier rastro de /840 o números de mes de vida
  let clean = raw.replace(/\s*\d+\s*\/\s*840/gi, '');
  clean = clean.replace(/semana\s*\d+/gi, '');
  clean = clean.trim();
  // Capitalizar primera letra
  if (clean.length > 0) {
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  }
  return clean || getMonthYearDisplay();
}

const currentDisplay = getMonthYearDisplay();

// Estado inicial limpio en 0 para cliente final
export const DEFAULT_MONTH: MesFinanciero = {
  id: 'mes_actual',
  nombre: currentDisplay,
  titulo: `Presupuesto ${currentDisplay}`,
  sueldoBase: 0,
  metas: [
    { id: 'meta_1', nombre: 'Fondo de Emergencia', acumulado: 0 },
    { id: 'meta_2', nombre: 'Meta Principal (Ahorro / Inversión)', acumulado: 0 }
  ],
  movimientos: []
};

export async function getStoredMonths(): Promise<MesFinanciero[]> {
  try {
    let raw = await AsyncStorage.getItem(STORAGE_KEY_MONTHS);
    if (!raw) {
      // Intentar migrar de v1 limpiando nombres
      const oldRaw = await AsyncStorage.getItem('@contamepues_finanzas_months_v1');
      if (oldRaw) {
        raw = oldRaw;
      }
    }

    if (!raw) {
      await saveStoredMonths([DEFAULT_MONTH]);
      return [DEFAULT_MONTH];
    }

    const parsed: MesFinanciero[] = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Limpiar nombres de cualquier 840 residual
      const cleaned = parsed.map(m => ({
        ...m,
        nombre: cleanMonthName(m.nombre),
        titulo: cleanMonthName(m.titulo || m.nombre)
      }));
      return cleaned;
    }
    return [DEFAULT_MONTH];
  } catch (e) {
    return [DEFAULT_MONTH];
  }
}

export async function saveStoredMonths(months: MesFinanciero[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_MONTHS, JSON.stringify(months));
  } catch (e) {}
}

export async function getActiveMonthId(): Promise<string> {
  try {
    const active = await AsyncStorage.getItem(STORAGE_KEY_ACTIVE_MONTH);
    if (active) return active;
  } catch (e) {}
  return DEFAULT_MONTH.id;
}

export async function setActiveMonthId(monthId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_ACTIVE_MONTH, monthId);
  } catch (e) {}
}

export async function getStoredTheme(): Promise<'dark' | 'light'> {
  try {
    const theme = await AsyncStorage.getItem(STORAGE_KEY_THEME);
    if (theme === 'dark') return 'dark';
    if (theme === 'light') return 'light';
  } catch (e) {}
  return 'light'; // Contame Pues diseño claro oficial por defecto
}

export async function setStoredTheme(theme: 'dark' | 'light'): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_THEME, theme);
  } catch (e) {}
}

export async function duplicateMonth(sourceMonthId: string, customName?: string): Promise<MesFinanciero[]> {
  const months = await getStoredMonths();
  const source = months.find(m => m.id === sourceMonthId) || months[0];

  const now = new Date();
  // Siguiente mes por defecto
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthDisplay = getMonthYearDisplay(nextMonthDate);

  const cleanName = customName ? cleanMonthName(customName) : nextMonthDisplay;

  // Los compromisos se replican con estado pendiente para el nuevo mes
  const duplicatedMovimientos: Movimiento[] = source.movimientos.map(m => ({
    ...m,
    id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    pagado: false
  }));

  const newMonth: MesFinanciero = {
    id: 'mes_' + Date.now(),
    nombre: cleanName,
    titulo: `Presupuesto ${cleanName}`,
    sueldoBase: source.sueldoBase,
    metas: source.metas.map(meta => ({ ...meta, id: 'meta_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5) })),
    movimientos: duplicatedMovimientos
  };

  const updated = [newMonth, ...months];
  await saveStoredMonths(updated);
  await setActiveMonthId(newMonth.id);
  return updated;
}

export async function getStoredUserProfile(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_USER_PROFILE);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

export async function saveStoredUserProfile(profile: UserProfile | null): Promise<void> {
  try {
    if (profile) {
      await AsyncStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(profile));
      await AsyncStorage.setItem('@contamepues_finanzas_cloud_user', profile.email);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY_USER_PROFILE);
      await AsyncStorage.removeItem('@contamepues_finanzas_cloud_user');
    }
  } catch (e) {}
}

export async function getStoredUsersDb(): Promise<UserProfile[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_USERS_DB);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export async function saveStoredUsersDb(users: UserProfile[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));
  } catch (e) {}
}

export async function registerLocalUser(
  nombre: string,
  email: string,
  password: string
): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanNombre = nombre.trim();

  if (!cleanNombre) {
    return { success: false, message: 'Por favor ingresa tu nombre completo.' };
  }
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { success: false, message: 'Por favor ingresa un correo electrónico válido.' };
  }
  if (!password || password.length < 6) {
    return { success: false, message: 'La contraseña debe tener mínimo 6 caracteres.' };
  }

  const existingUsers = await getStoredUsersDb();
  const exists = existingUsers.some(u => u.email.toLowerCase() === cleanEmail);
  if (exists) {
    return {
      success: false,
      message: 'Ya existe una cuenta con este correo. Puedes iniciar sesión directamente.'
    };
  }

  const newUser: UserProfile = {
    id: 'user_' + Date.now(),
    nombre: cleanNombre,
    email: cleanEmail,
    password: password,
    creadoEn: new Date().toISOString(),
    ultimaSincronizacion: new Date().toISOString()
  };

  const updatedUsers = [...existingUsers, newUser];
  await saveStoredUsersDb(updatedUsers);
  await saveStoredUserProfile(newUser);

  return { success: true, user: newUser };
}

export async function loginLocalUser(
  email: string,
  password: string
): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, message: 'Por favor ingresa tu correo electrónico.' };
  }
  if (!password) {
    return { success: false, message: 'Por favor ingresa tu contraseña.' };
  }

  const existingUsers = await getStoredUsersDb();
  const found = existingUsers.find(u => u.email.toLowerCase() === cleanEmail);

  if (!found) {
    return {
      success: false,
      message: 'No encontramos una cuenta con este correo. Por favor crea una cuenta primero.'
    };
  }

  if (found.password && found.password !== password) {
    return { success: false, message: 'Contraseña incorrecta. Inténtalo de nuevo.' };
  }

  const updatedUser: UserProfile = {
    ...found,
    ultimaSincronizacion: new Date().toISOString()
  };

  await saveStoredUserProfile(updatedUser);
  return { success: true, user: updatedUser };
}

export async function isFirstLaunch(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEY_FIRST_LAUNCH);
    return val === null;
  } catch (e) {
    return false;
  }
}

export async function setFirstLaunchCompleted(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_FIRST_LAUNCH, 'true');
  } catch (e) {}
}

// ==================== SUSCRIPCIONES RECURRENTES ====================
export const DEFAULT_SUSCRIPCIONES: Suscripcion[] = [
  { id: 'sub_1', nombre: 'Netflix', monto: 26900, categoria: 'Gastos opcionales', diaCobro: 15, emoji: '🎬', activo: true },
  { id: 'sub_2', nombre: 'Spotify', monto: 18900, categoria: 'Gastos opcionales', diaCobro: 5, emoji: '🎵', activo: true },
  { id: 'sub_3', nombre: 'Gimnasio', monto: 85000, categoria: 'Salud', diaCobro: 1, emoji: '🏋️', activo: true }
];

const STORAGE_KEY_SUBSCRIPCIONES = '@contamepues_finanzas_suscripciones_v1';

export async function getStoredSuscripciones(): Promise<Suscripcion[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_SUBSCRIPCIONES);
    if (!raw) return DEFAULT_SUSCRIPCIONES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_SUSCRIPCIONES;
  } catch {
    return DEFAULT_SUSCRIPCIONES;
  }
}

export async function saveStoredSuscripciones(items: Suscripcion[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_SUBSCRIPCIONES, JSON.stringify(items));
  } catch {}
}

// ==================== PRESUPUESTOS POR CATEGORÍA (ENVELOPES) ====================
export const DEFAULT_PRESUPUESTOS: PresupuestoCategoria[] = [
  { categoria: 'Supermercado', limite: 600000 },
  { categoria: 'Comida fuera', limite: 250000 },
  { categoria: 'Transporte', limite: 180000 }
];

const STORAGE_KEY_PRESUPUESTOS = '@contamepues_finanzas_presupuestos_v1';

export async function getStoredPresupuestos(): Promise<PresupuestoCategoria[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_PRESUPUESTOS);
    if (!raw) return DEFAULT_PRESUPUESTOS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_PRESUPUESTOS;
  } catch {
    return DEFAULT_PRESUPUESTOS;
  }
}

export async function saveStoredPresupuestos(items: PresupuestoCategoria[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_PRESUPUESTOS, JSON.stringify(items));
  } catch {}
}

// ==================== MANEJO E INTELIGENCIA DE DEUDAS ====================
export const DEFAULT_DEUDAS: DeudaItem[] = [
  { id: 'deuda_1', nombre: 'Tarjeta de Crédito', saldoTotal: 1200000, cuotaMinima: 120000, tasaInteresAnual: 28, diaCorte: 17, plazoMeses: 12 }
];

const STORAGE_KEY_DEUDAS = '@contamepues_finanzas_deudas_v1';

export async function getStoredDeudas(): Promise<DeudaItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_DEUDAS);
    if (!raw) return DEFAULT_DEUDAS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_DEUDAS;
  } catch {
    return DEFAULT_DEUDAS;
  }
}

export async function saveStoredDeudas(items: DeudaItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_DEUDAS, JSON.stringify(items));
  } catch {}
}

// ==================== PREFERENCIA DE POSICIÓN DEL FAB ====================
export const STORAGE_KEY_FAB_POSITION = '@contamepues_finanzas_fab_position_v1';

export async function getStoredFabPosition(): Promise<FabPosition> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_FAB_POSITION);
    if (raw === 'izquierda' || raw === 'centro' || raw === 'derecha') return raw;
  } catch {}
  return 'derecha';
}

export async function saveStoredFabPosition(pos: FabPosition): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_FAB_POSITION, pos);
  } catch {}
}
// ==================== PREFERENCIA DE AVATAR / EMOTICON ====================
export const STORAGE_KEY_AVATAR_EMOJI = '@contamepues_finanzas_avatar_emoji_v1';

export async function getStoredAvatarEmoji(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY_AVATAR_EMOJI);
  } catch {
    return null;
  }
}

export async function saveStoredAvatarEmoji(emoji: string | null): Promise<void> {
  try {
    if (emoji) {
      await AsyncStorage.setItem(STORAGE_KEY_AVATAR_EMOJI, emoji);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY_AVATAR_EMOJI);
    }
  } catch {}
}
