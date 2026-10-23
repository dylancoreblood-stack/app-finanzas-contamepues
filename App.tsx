import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
  Share,
  KeyboardAvoidingView,
  ActivityIndicator,
  Linking,
  Image,
  useWindowDimensions
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { lightTheme, darkTheme, ThemeType } from './src/theme';
import { MesFinanciero, Movimiento, MetaAhorro, MovimientoBancarioDetectado, TipoMovimiento, UserProfile } from './src/types';
import {
  getStoredMonths,
  saveStoredMonths,
  getActiveMonthId,
  setActiveMonthId,
  getStoredTheme,
  setStoredTheme,
  duplicateMonth,
  cleanMonthName,
  getMonthYearDisplay,
  getStoredUserProfile,
  saveStoredUserProfile,
  registerLocalUser,
  loginLocalUser,
  isFirstLaunch,
  setFirstLaunchCompleted,
  DEFAULT_MONTH,
  MESES_ES,
  getStoredPrivacyMode,
  setStoredPrivacyMode,
  getStoredPrivacySections,
  setStoredPrivacySections,
  PrivacySectionsConfig,
  DEFAULT_PRIVACY_SECTIONS,
  Suscripcion,
  getStoredSuscripciones,
  saveStoredSuscripciones,
  DEFAULT_SUSCRIPCIONES,
  PresupuestoCategoria,
  getStoredPresupuestos,
  saveStoredPresupuestos,
  DEFAULT_PRESUPUESTOS,
  DeudaItem,
  getStoredDeudas,
  saveStoredDeudas,
  DEFAULT_DEUDAS,
  FabPosition,
  getStoredFabPosition,
  saveStoredFabPosition,
  getStoredAvatarEmoji,
  saveStoredAvatarEmoji
} from './src/services/storage';
import {
  parseColombianNotification,
  parseMonto,
  SAMPLE_BANK_NOTIFICATIONS
} from './src/services/bankScanner';
import { generateExcelWorkbook, downloadExcelWeb } from './src/services/excelExport';
import {
  registerWithFirebase,
  loginWithFirebase,
  logoutFromFirebase,
  syncMonthsToFirestore,
  fetchMonthsFromFirestore,
  fetchFullUserDataFromFirestore,
  updateUserAvatarInFirestore,
  resetPasswordWithFirebase,
  updateUserProfileName
} from './src/services/firebase';

// Huevo de Pascua Temático Mensual según el mes en curso (12 meses festivos)
function getSeasonalEasterEgg(monthIndex?: number): { emoji: string; title: string; desc: string } {
  const currentIdx = typeof monthIndex === 'number' && monthIndex >= 0 && monthIndex <= 11
    ? monthIndex
    : new Date().getMonth();

  const seasonalMap: Record<number, { emoji: string; title: string; desc: string }> = {
    0: { emoji: '🎆', title: '¡Mes de Año Nuevo!', desc: 'Metas financieras renovadas: El mejor momento para planear tu año sin deudas innecesarias. 🚀' },
    1: { emoji: '💘', title: '¡Mes de San Valentín!', desc: 'Demuestra afecto con detalles sinceros, no con gastos que rompan tu presupuesto. 💖' },
    2: { emoji: '🍀', title: '¡Mes de la Prosperidad!', desc: 'Disciplina y paciencia: el secreto para que tu fondo de ahorro crezca con suerte. 🌱' },
    3: { emoji: '🌸', title: '¡Mes de Florecer!', desc: 'Siembra en tus fondos y sobres hoy para cosechar tranquilidad mañana. 🌼' },
    4: { emoji: '💐', title: '¡Mes de las Madres!', desc: 'Homenajea a quien más quieres con amor y organización financiera impecable. 🌷' },
    5: { emoji: '☀️', title: '¡Mitad de Año y Prima!', desc: 'Momento de primas: recuerda destinar al menos el 30% a ahorro o liquidar deudas. 💰' },
    6: { emoji: '🏖️', title: '¡Mes de Vacaciones!', desc: 'Disfruta tus descansos planificados con anticipación y cero remordimientos. 🌴' },
    7: { emoji: '🪁', title: '¡Mes de las Cometas!', desc: 'Vientos de libertad: Haz que tus metas financieras vuelen tan alto como tus sueños. 🪁' },
    8: { emoji: '🎁', title: '¡Amor y Amistad!', desc: 'Celebra con tus amigos y seres queridos cuidando el valor de cada peso. 🤝' },
    9: { emoji: '🎃', title: '¡Halloween Financiero!', desc: '¡Finanzas sin sustos ni fantasmas! Mantén tus deudas a raya para que nada te quite el sueño. 👻 🍬' },
    10: { emoji: '🍂', title: '¡Otoño y Compras Conscientes!', desc: 'Cuidado con el Black Friday: compra solo lo que de verdad necesitas y presupuestaste. 🛍️' },
    11: { emoji: '🎄', title: '¡Navidad y Fin de Año!', desc: '¡Buñuelos, natilla y primas bien administradas! Cierra el año en verde con tu familia. 🎅 ⭐' }
  };

  return seasonalMap[currentIdx] || seasonalMap[9];
}

// Error Boundary para evitar pantallas blancas por excepciones no controladas en navegadores
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#090D16', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 44, marginBottom: 12 }}>🛡️</Text>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#FFF', textAlign: 'center', marginBottom: 8 }}>
            Finanzas Contame Pues
          </Text>
          <Text style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 19, marginBottom: 20 }}>
            Se actualizó el estado de tus registros. Toca para continuar sin interrupciones.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#10B981', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 14 }}
            onPress={this.handleReload}
          >
            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 14 }}>Continuar</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

export default function AppWrapper() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <View style={webFrameStyles.outerContainer}>
          <View
            style={[
              webFrameStyles.innerShell,
              isDesktop && webFrameStyles.innerShellDesktop,
              isTablet && webFrameStyles.innerShellTablet
            ]}
          >
            <MainApp />
          </View>
        </View>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const webFrameStyles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%'
  },
  innerShell: {
    flex: 1,
    width: '100%',
    maxWidth: 500,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 12px 40px rgba(27, 36, 50, 0.08), 0 0 0 1px rgba(27, 36, 50, 0.06)',
    } : {})
  },
  innerShellDesktop: {
    maxWidth: 1280,
    backgroundColor: 'transparent',
    boxShadow: 'none',
    paddingHorizontal: 20
  },
  innerShellTablet: {
    maxWidth: 860,
    backgroundColor: 'transparent',
    boxShadow: 'none',
    paddingHorizontal: 16
  }
});

function formatCOP(val: number): string {
  return '$ ' + Math.round(Number(val) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Fondo con Shader Fluido Orgánico (Creative Motion Graphics + ShaderGradient Mesh)
function FluidShaderBackground({ isDark }: { isDark: boolean }) {
  const canvasRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext ? canvas.getContext('2d') : null;
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // Deterministic time in seconds (Creative Motion Graphics Rule 1A)
      const t = performance.now() / 1000;

      const parent = canvas.parentElement;
      const cssW = (parent && parent.clientWidth > 0) ? parent.clientWidth : (canvas.clientWidth || 400);
      const cssH = (parent && parent.clientHeight > 0) ? parent.clientHeight : (canvas.clientHeight || 280);
      const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

      const targetW = Math.round(cssW * dpr);
      const targetH = Math.round(cssH * dpr);

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, cssW, cssH);

      // Base Canvas Gradient (Contame Pues Corporate Slate Navy)
      const bgGrad = ctx.createLinearGradient(0, 0, cssW, cssH);
      if (isDark) {
        bgGrad.addColorStop(0, '#1B2432');
        bgGrad.addColorStop(0.5, '#141A24');
        bgGrad.addColorStop(1, '#0F141C');
      } else {
        bgGrad.addColorStop(0, '#FFFBEB');
        bgGrad.addColorStop(0.5, '#F5F7FA');
        bgGrad.addColorStop(1, '#FFFFFF');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, cssW, cssH);

      // Wave 1: Contame Pues Golden Amber Harmonic (Primary brand focus #F6AC13)
      const cx1 = cssW * 0.42 + Math.sin(t * 0.55) * 55;
      const cy1 = cssH * 0.35 + Math.cos(t * 0.65) * 35;
      const r1 = Math.max(cssW, cssH) * 0.72;
      const grad1 = ctx.createRadialGradient(cx1, cy1, 8, cx1, cy1, r1);
      grad1.addColorStop(0, isDark ? 'rgba(246, 172, 19, 0.40)' : 'rgba(246, 172, 19, 0.24)');
      grad1.addColorStop(0.5, isDark ? 'rgba(217, 119, 6, 0.18)' : 'rgba(217, 119, 6, 0.10)');
      grad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, cssW, cssH);

      // Wave 2: Contame Pues Slate Navy Harmonic (#2B384E)
      const cx2 = cssW * 0.78 + Math.cos(t * 0.48) * 45;
      const cy2 = cssH * 0.65 + Math.sin(t * 0.58) * 35;
      const r2 = Math.max(cssW, cssH) * 0.65;
      const grad2 = ctx.createRadialGradient(cx2, cy2, 8, cx2, cy2, r2);
      grad2.addColorStop(0, isDark ? 'rgba(43, 56, 78, 0.45)' : 'rgba(43, 56, 78, 0.16)');
      grad2.addColorStop(0.55, isDark ? 'rgba(27, 36, 50, 0.20)' : 'rgba(43, 56, 78, 0.08)');
      grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, cssW, cssH);

      // Wave 3: Safety Crimson Red Anchor (#ED3432 - Casco SST)
      const cx3 = cssW * 0.15 + Math.sin(t * 0.35) * 40;
      const cy3 = cssH * 0.85 + Math.cos(t * 0.42) * 30;
      const r3 = Math.max(cssW, cssH) * 0.60;
      const grad3 = ctx.createRadialGradient(cx3, cy3, 10, cx3, cy3, r3);
      grad3.addColorStop(0, isDark ? 'rgba(237, 52, 50, 0.22)' : 'rgba(237, 52, 50, 0.12)');
      grad3.addColorStop(0.6, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad3;
      ctx.fillRect(0, 0, cssW, cssH);

      // Specular Top Rim Highlight (Golden reflection)
      const rimGrad = ctx.createLinearGradient(0, 0, cssW, 0);
      rimGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      rimGrad.addColorStop(0.2, isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.60)');
      rimGrad.addColorStop(0.5, isDark ? 'rgba(254, 240, 138, 0.50)' : 'rgba(246, 172, 19, 0.40)');
      rimGrad.addColorStop(0.8, isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.60)');
      rimGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = rimGrad;
      ctx.fillRect(0, 0, cssW, 1.5);

      // Subtle Luminescent Micro-Orbs (Golden Amber)
      for (let i = 0; i < 4; i++) {
        const px = (cssW * 0.2 + i * (cssW * 0.22) + Math.sin(t * 0.8 + i * 1.5) * 22) % cssW;
        const py = (cssH * 0.28 + Math.cos(t * 0.65 + i * 1.2) * 20 + (i % 2) * 45) % cssH;
        const orbRadius = 1.2 + Math.sin(t * 2.0 + i) * 0.4;
        ctx.beginPath();
        ctx.arc(px, py, orbRadius, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? 'rgba(254, 240, 138, 0.45)' : 'rgba(246, 172, 19, 0.35)';
        ctx.fill();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isDark]);

  if (Platform.OS === 'web') {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: 30,
            opacity: 0.95
          } as any}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark ? 'rgba(7, 9, 14, 0.45)' : 'rgba(255, 255, 255, 0.40)',
              borderRadius: 30,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)'
            }
          ]}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: isDark ? '#08140F' : '#E8F5E9',
          borderRadius: 30,
          opacity: 0.85
        }
      ]}
      pointerEvents="none"
    />
  );
}

export interface CategoriaVisual {
  nombre: string;
  emoji: string;
  color: string;
}

export const CATEGORIAS_VISUALES: CategoriaVisual[] = [
  { nombre: 'Supermercado', emoji: '🛒', color: '#10B981' },
  { nombre: 'Hogar / Arriendo', emoji: '🏠', color: '#6366F1' },
  { nombre: 'Servicios', emoji: '⚡', color: '#F59E0B' },
  { nombre: 'Transporte', emoji: '🚗', color: '#3B82F6' },
  { nombre: 'Deudas', emoji: '💳', color: '#EF4444' },
  { nombre: 'Comida fuera', emoji: '🍔', color: '#EC4899' },
  { nombre: 'Salud', emoji: '💊', color: '#14B8A6' },
  { nombre: 'Gastos opcionales', emoji: '🛍️', color: '#8B5CF6' },
  { nombre: 'Ahorro / Metas', emoji: '🎯', color: '#10B981' },
  { nombre: 'Ingreso Sueldo', emoji: '💰', color: '#059669' },
  { nombre: 'Otro', emoji: '✨', color: '#6B7280' }
];

function getCategoryEmoji(cat?: string, tipo?: string): string {
  if (tipo && String(tipo).toLowerCase() === 'ingreso') return '💰';
  const c = String(cat || '').toLowerCase();
  for (const item of CATEGORIAS_VISUALES) {
    if (c.includes(item.nombre.toLowerCase())) return item.emoji;
  }
  if (c.includes('deuda') || c.includes('tarjeta') || c.includes('préstamo') || c.includes('prestamo')) return '💳';
  if (c.includes('fijo') || c.includes('arriendo') || c.includes('hogar') || c.includes('mercado')) return '🏠';
  if (c.includes('servicio') || c.includes('luz') || c.includes('agua') || c.includes('internet')) return '⚡';
  if (c.includes('ahorro') || c.includes('inversion')) return '🎯';
  if (c.includes('transporte') || c.includes('gasolina')) return '🚗';
  return '💸';
}

function parseMonthYear(monthName: string): { year: number; month: number } {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  
  if (monthName) {
    const clean = monthName.toLowerCase();
    for (let i = 0; i < MESES_ES.length; i++) {
      if (clean.includes(MESES_ES[i].toLowerCase())) {
        month = i;
        break;
      }
    }
    const matchYear = monthName.match(/\b(20\d\d)\b/);
    if (matchYear) {
      year = parseInt(matchYear[1], 10);
    }
  }
  return { year, month };
}

function getTxDay(tx?: Movimiento | null, targetYear?: number, targetMonth?: number): number | null {
  if (!tx) return null;
  if (tx.fecha) {
    const parts = String(tx.fecha).split('-');
    if (parts.length === 3) {
      const d = parseInt(parts[2], 10);
      if (d >= 1 && d <= 31) return d;
    }
  }
  const parts = String(tx.id || '').split('_');
  if (parts.length > 1) {
    const ts = Number(parts[1]);
    if (!isNaN(ts) && ts > 1000000000000 && targetYear !== undefined && targetMonth !== undefined) {
      const d = new Date(ts);
      if (d.getFullYear() === targetYear && d.getMonth() === targetMonth) {
        return d.getDate();
      }
    }
  }
  return null;
}

function MainApp() {
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 1024;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isMobile = windowWidth < 768;

  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('light');
  const theme: ThemeType = themeMode === 'dark' ? darkTheme : lightTheme;

  const [months, setMonths] = useState<MesFinanciero[]>([DEFAULT_MONTH]);
  const [activeMonthId, setActiveId] = useState<string>(DEFAULT_MONTH.id);
  const [hubTab, setHubTab] = useState<'resumen' | 'pro' | 'cuenta'>('resumen');
  const [isPagadasExpanded, setIsPagadasExpanded] = useState<boolean>(false);
  const [isIngresosExpanded, setIsIngresosExpanded] = useState<boolean>(false);

  // Filtros de búsqueda
  const [selectedCategoryChip, setSelectedCategoryChip] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');

  // Modales
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showEditMetaModal, setShowEditMetaModal] = useState<boolean>(false);
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
  const [showMonthModal, setShowMonthModal] = useState<boolean>(false);
  const [showTutorialModal, setShowTutorialModal] = useState<boolean>(false);
  const [tutorialStep, setTutorialStep] = useState<number>(0);
  const [showMonthPicker, setShowMonthPicker] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Diálogo de Confirmación Universal (100% Web & Mobile sin fallas de Alert)
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    onConfirm: () => {}
  });

  const openConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText = 'Confirmar'
  ) => {
    setConfirmModal({
      visible: true,
      title,
      message,
      confirmText,
      onConfirm
    });
  };

  // Perfil de usuario y cuenta (offline-first con preparación para sincronización en la nube)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showCloudBanner, setShowCloudBanner] = useState<boolean>(true);
  const [authTab, setAuthTab] = useState<'register' | 'login' | 'forgot'>('login');
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [editUserName, setEditUserName] = useState<string>('');
  const [isEditingUserName, setIsEditingUserName] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Estado para editar un movimiento existente
  const [editingTx, setEditingTx] = useState<Movimiento | null>(null);
  const [editDesc, setEditDesc] = useState<string>('');
  const [editMonto, setEditMonto] = useState<string>('');
  const [editCat, setEditCat] = useState<string>('');
  const [editTipo, setEditTipo] = useState<TipoMovimiento>('Egreso');
  const [editPagado, setEditPagado] = useState<boolean>(false);

  // Estado para editar una meta existente
  const [editingMeta, setEditingMeta] = useState<MetaAhorro | null>(null);
  const [editMetaNombre, setEditMetaNombre] = useState<string>('');
  const [editMetaMonto, setEditMetaMonto] = useState<string>('');

  // Estados para nuevo movimiento
  const [newTipo, setNewTipo] = useState<TipoMovimiento>('Egreso');
  const [newCat, setNewCat] = useState<string>('Supermercado');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newMonto, setNewMonto] = useState<string>('');
  const [newTxDate, setNewTxDate] = useState<string>('');

  // Modo Privacidad Independiente por Sección (Disponible, Ingresos, Compromisos, Metas)
  const [privacySections, setPrivacySections] = useState<PrivacySectionsConfig>(DEFAULT_PRIVACY_SECTIONS);

  // Secciones colapsables / dinámicas
  const [isGoalsExpanded, setIsGoalsExpanded] = useState<boolean>(true);
  const [isDistributionExpanded, setIsDistributionExpanded] = useState<boolean>(false);

  // Calendario interactivo del mes
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Filtro por rango de fechas (Todos, 7 días, 15 días, 30 días, 60 días)
  const [dateRangeFilter, setDateRangeFilter] = useState<'ALL' | '7D' | '15D' | '30D' | '60D'>('ALL');

  // Modal para Crear Nueva Meta de Ahorro (hasta 3 o más metas)
  const [showNewMetaModal, setShowNewMetaModal] = useState<boolean>(false);
  const [newMetaName, setNewMetaName] = useState<string>('');
  const [newMetaAmount, setNewMetaAmount] = useState<string>('');

  // Configuración de sueldo y ciclo financiero
  const [setupSueldo, setSetupSueldo] = useState<string>('');
  const [setupCicloDia, setSetupCicloDia] = useState<number>(1);
  const [setupCicloFrecuencia, setSetupCicloFrecuencia] = useState<'mensual' | 'quincenal'>('mensual');
  const [setupIngresoRecurrente, setSetupIngresoRecurrente] = useState<boolean>(true);

  // Nuevo Mes
  const [dupName, setDupName] = useState<string>('');

  // Escáner bancario
  const [pastedNotification, setPastedNotification] = useState<string>('');
  const [detectedNotifications, setDetectedNotifications] = useState<MovimientoBancarioDetectado[]>([]);

  // FASE 1: Ingreso a un Clic (FAB + Numpad Táctil)
  const [showNumpadModal, setShowNumpadModal] = useState<boolean>(false);
  const [numpadAmount, setNumpadAmount] = useState<string>('0');
  const [numpadTipo, setNumpadTipo] = useState<TipoMovimiento>('Egreso');
  const [numpadCat, setNumpadCat] = useState<string>('Supermercado');
  const [numpadDesc, setNumpadDesc] = useState<string>('');

  // FASE 2: Suscripciones Recurrentes
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>(DEFAULT_SUSCRIPCIONES);
  const [isSubsExpanded, setIsSubsExpanded] = useState<boolean>(false);
  const [showSubModal, setShowSubModal] = useState<boolean>(false);
  const [newSubNombre, setNewSubNombre] = useState<string>('');
  const [newSubMonto, setNewSubMonto] = useState<string>('');
  const [newSubDia, setNewSubDia] = useState<string>('15');
  const [newSubCat, setNewSubCat] = useState<string>('Gastos opcionales');

  // FASE 3: Presupuestos por Categoría (Envelopes / Sobres)
  const [presupuestos, setPresupuestos] = useState<PresupuestoCategoria[]>(DEFAULT_PRESUPUESTOS);
  const [isEnvelopesExpanded, setIsEnvelopesExpanded] = useState<boolean>(false);
  const [showPresupuestoModal, setShowPresupuestoModal] = useState<boolean>(false);
  const [editingBudgetIndex, setEditingBudgetIndex] = useState<number | null>(null);
  const [budgetCat, setBudgetCat] = useState<string>('Supermercado');
  const [budgetAmount, setBudgetAmount] = useState<string>('');

  // FASE 5: Manejo e Inteligencia de Deudas
  const [deudas, setDeudas] = useState<DeudaItem[]>(DEFAULT_DEUDAS);
  const [isDeudasExpanded, setIsDeudasExpanded] = useState<boolean>(false);
  const [showDeudaModal, setShowDeudaModal] = useState<boolean>(false);
  const [editingDeudaId, setEditingDeudaId] = useState<string | null>(null);
  const [abonoExtraMensual, setAbonoExtraMensual] = useState<number>(100000);
  const [estrategiaDeuda, setEstrategiaDeuda] = useState<'snowball' | 'avalanche'>('snowball');
  const [newDeudaNombre, setNewDeudaNombre] = useState<string>('');
  const [newDeudaSaldo, setNewDeudaSaldo] = useState<string>('');
  const [newDeudaCuota, setNewDeudaCuota] = useState<string>('');
  const [newDeudaTasa, setNewDeudaTasa] = useState<string>('28');
  const [newDeudaDia, setNewDeudaDia] = useState<string>('17');
  const [newDeudaPlazo, setNewDeudaPlazo] = useState<string>('12');

  // Personalización de Usuario & Avatar
  const [showAvatarPickerModal, setShowAvatarPickerModal] = useState<boolean>(false);

  // Renombrar Meses
  const [showRenameMonthModal, setShowRenameMonthModal] = useState<boolean>(false);
  const [monthToRenameId, setMonthToRenameId] = useState<string>('');
  const [renameMonthInput, setRenameMonthInput] = useState<string>('');

  // Posición del Botón Flotante (FAB)
  const [fabPosition, setFabPosition] = useState<FabPosition>('derecha');

  useEffect(() => {
    (async () => {
      const savedTheme = await getStoredTheme();
      setThemeMode(savedTheme);
      
      const [savedSections, savedSubs, savedBudgets, savedDeudas, savedFabPos] = await Promise.all([
        getStoredPrivacySections(),
        getStoredSuscripciones(),
        getStoredPresupuestos(),
        getStoredDeudas(),
        getStoredFabPosition()
      ]);
      setPrivacySections(savedSections);
      setSuscripciones(savedSubs);
      setPresupuestos(savedBudgets);
      setDeudas(savedDeudas);
      setFabPosition(savedFabPos);

      const storedMonths = await getStoredMonths();
      setMonths(storedMonths);
      const activeId = await getActiveMonthId();
      setActiveId(activeId);

      // Cargar perfil de usuario guardado previamente
      const profile = await getStoredUserProfile();
      const localAvatar = await getStoredAvatarEmoji();
      if (profile) {
        if (!profile.avatarEmoji && localAvatar) {
          profile.avatarEmoji = localAvatar;
        }
        setUserProfile(profile);
        fetchFullUserDataFromFirestore(profile.id).then(cloudData => {
          if (cloudData) {
            if (cloudData.months && cloudData.months.length > 0) {
              setMonths(cloudData.months);
              saveStoredMonths(cloudData.months);
            }
            if (cloudData.suscripciones && cloudData.suscripciones.length > 0) {
              setSuscripciones(cloudData.suscripciones);
              saveStoredSuscripciones(cloudData.suscripciones);
            }
            if (cloudData.presupuestos && cloudData.presupuestos.length > 0) {
              setPresupuestos(cloudData.presupuestos);
              saveStoredPresupuestos(cloudData.presupuestos);
            }
            if (cloudData.deudas && cloudData.deudas.length > 0) {
              setDeudas(cloudData.deudas);
              saveStoredDeudas(cloudData.deudas);
            }
            if (cloudData.avatarEmoji || cloudData.nombre) {
              const updatedProfile: UserProfile = {
                ...profile,
                avatarEmoji: cloudData.avatarEmoji || profile.avatarEmoji,
                nombre: cloudData.nombre || profile.nombre
              };
              setUserProfile(updatedProfile);
              saveStoredUserProfile(updatedProfile);
              if (cloudData.avatarEmoji) {
                saveStoredAvatarEmoji(cloudData.avatarEmoji);
              }
            }
          }
        }).catch(() => {});
      } else if (localAvatar) {
        // En modo local sin cuenta registrada, conservar el emoticon elegido
        setUserProfile({
          id: 'user_local_' + Date.now(),
          nombre: 'Usuario de Finanzas',
          email: '',
          creadoEn: new Date().toISOString(),
          avatarEmoji: localAvatar
        });
      }

      // Si es primera vez abriendo la app, mostrar el tutorial guiado
      const firstTime = await isFirstLaunch();
      if (firstTime) {
        setTutorialStep(0);
        setShowTutorialModal(true);
        await setFirstLaunchCompleted();
      }
    })();
  }, []);

  const currentMonth = months.find(m => m.id === activeMonthId) || months[0] || DEFAULT_MONTH;

  const toggleThemeMode = async () => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    await setStoredTheme(next);
  };

  const handleSelectMonth = async (mId: string) => {
    setActiveId(mId);
    await setActiveMonthId(mId);
    setShowMonthPicker(false);
  };

  // Navegación rápida entre meses
  const handlePrevMonth = async () => {
    const currentIndex = months.findIndex(m => m.id === currentMonth.id);
    if (currentIndex < months.length - 1) {
      const prevMonth = months[currentIndex + 1];
      await handleSelectMonth(prevMonth.id);
    }
  };

  const handleNextMonth = async () => {
    const currentIndex = months.findIndex(m => m.id === currentMonth.id);
    if (currentIndex > 0) {
      const nextMonth = months[currentIndex - 1];
      await handleSelectMonth(nextMonth.id);
    }
  };

  // Alternar privacidad de forma independiente en una sección específica
  const toggleSectionPrivacy = async (section: keyof PrivacySectionsConfig) => {
    const updated = {
      ...privacySections,
      [section]: !privacySections[section]
    };
    setPrivacySections(updated);
    await setStoredPrivacySections(updated);
  };

  const isAnySectionHidden = privacySections.disponible || privacySections.ingresos || privacySections.compromisos || privacySections.metas;

  // Botón maestro del Topbar
  const toggleMasterPrivacy = async () => {
    const target = !isAnySectionHidden;
    const updated: PrivacySectionsConfig = {
      disponible: target,
      ingresos: target,
      compromisos: target,
      metas: target
    };
    setPrivacySections(updated);
    await setStoredPrivacySections(updated);
  };

  // Formateadores independientes por sección
  const formatDisponible = (val: number): string => {
    if (privacySections.disponible) return '$ ••••••';
    return formatCOP(val);
  };

  const formatIngresos = (val: number): string => {
    if (privacySections.ingresos) return '$ ••••••';
    return formatCOP(val);
  };

  const formatCompromisos = (val: number): string => {
    if (privacySections.compromisos) return '$ ••••••';
    return formatCOP(val);
  };

  const formatMetas = (val: number): string => {
    if (privacySections.metas) return '$ ••••••';
    return formatCOP(val);
  };

  // Descomposición del mes activo para el calendario
  const { year: monthYear, month: monthIndex } = useMemo(() => {
    return parseMonthYear(currentMonth.nombre);
  }, [currentMonth.nombre]);

  const daysInMonth = useMemo(() => {
    return new Date(monthYear, monthIndex + 1, 0).getDate();
  }, [monthYear, monthIndex]);

  const firstDayOfWeek = useMemo(() => {
    // 0 = Lunes, 6 = Domingo (estilo latinoamericano)
    return (new Date(monthYear, monthIndex, 1).getDay() + 6) % 7;
  }, [monthYear, monthIndex]);

  const txsByDay = useMemo(() => {
    const map: Record<number, { hasIngreso: boolean; hasEgreso: boolean; count: number; totalEgreso: number; totalIngreso: number }> = {};
    for (const tx of currentMonth.movimientos) {
      const day = getTxDay(tx, monthYear, monthIndex);
      if (day && day >= 1 && day <= 31) {
        if (!map[day]) {
          map[day] = { hasIngreso: false, hasEgreso: false, count: 0, totalEgreso: 0, totalIngreso: 0 };
        }
        map[day].count += 1;
        const montoNum = Number(tx.monto) || 0;
        if ((tx.tipo || '').toLowerCase() === 'ingreso') {
          map[day].hasIngreso = true;
          map[day].totalIngreso += montoNum;
        } else {
          map[day].hasEgreso = true;
          map[day].totalEgreso += montoNum;
        }
      }
    }
    return map;
  }, [currentMonth?.movimientos, monthYear, monthIndex]);

  // Cálculos del Mes Reactivos e Interconectados en Tiempo Real
  const txsAll = currentMonth?.movimientos || [];
  const ingresosList = txsAll.filter(t => (t.tipo || '').toLowerCase() === 'ingreso');
  const ingresosTotal = ingresosList.reduce((acc, t) => acc + (Number(t.monto) || 0), 0);
  const ingresosRecibidosTotal = ingresosList.filter(t => Boolean(t.pagado)).reduce((acc, t) => acc + (Number(t.monto) || 0), 0);
  const ingresosPendientes = Math.max(0, ingresosTotal - ingresosRecibidosTotal);

  const egresosList = txsAll.filter(t => (t.tipo || '').toLowerCase() !== 'ingreso');
  const egresosTotal = egresosList.reduce((acc, t) => acc + (Number(t.monto) || 0), 0);
  const egresosPagados = egresosList.filter(t => Boolean(t.pagado)).reduce((acc, t) => acc + (Number(t.monto) || 0), 0);
  const egresosPendientes = Math.max(0, egresosTotal - egresosPagados);

  // Dinero en Mano / Cuenta Real Hoy (Caja Efectiva Disponible):
  // Si el usuario tiene ingresos registrados en el mes, esos son sus ingresos reales; si aún no hay movimientos, se toma el sueldo base como proyección.
  const sueldoBaseNum = Number(currentMonth?.sueldoBase) || 0;
  const totalIngresosMes = ingresosTotal > 0 ? ingresosTotal : sueldoBaseNum;
  const baseDisponibleIngresos = ingresosRecibidosTotal > 0 ? ingresosRecibidosTotal : totalIngresosMes;
  const dineroDisponibleReal = baseDisponibleIngresos - egresosPagados;
  // Dinero libre total tras pagar todos los compromisos del mes (armonizado 100% con el historial):
  const dineroLibreTotal = totalIngresosMes - egresosTotal;
  const dineroLibreProyectado = dineroLibreTotal;
  const dineroLibre = dineroLibreTotal; // Mantiene consistencia y reactividad total en toda la app
  const pctPagado = egresosTotal > 0 && !isNaN(egresosPagados)
    ? Math.min(100, Math.max(0, Math.round((egresosPagados / egresosTotal) * 100)))
    : (egresosPagados > 0 ? 100 : 0);
  const totalFondos = (currentMonth?.metas || []).reduce((acc, m) => acc + (Number(m.acumulado) || 0), 0);

  // Actualizar estado local y sincronizar automáticamente con Cloud Firestore
  const updateMonthsStateAndCloud = async (updatedMonths: MesFinanciero[]) => {
    try {
      setMonths(updatedMonths);
      await saveStoredMonths(updatedMonths);
      if (userProfile && userProfile.id) {
        syncMonthsToFirestore(userProfile.id, updatedMonths).catch(() => {});
      }
    } catch (e) {
      console.error('Error updating months state:', e);
    }
  };

  // Marcar como pagado con 1 toque con protección anti-crash
  const togglePaid = async (txId: string) => {
    try {
      const updated = months.map(m => {
        if (m.id !== currentMonth.id) return m;
        return {
          ...m,
          movimientos: (m.movimientos || []).map(tx => tx.id === txId ? { ...tx, pagado: !tx.pagado } : tx)
        };
      });
      await updateMonthsStateAndCloud(updated);
    } catch (e) {
      console.error('Error toggling paid status:', e);
    }
  };

  // Abrir modal para editar movimiento existente
  const openEditTxModal = (tx: Movimiento) => {
    setEditingTx(tx);
    setEditDesc(tx.descripcion);
    setEditMonto(String(tx.monto));
    setEditCat(tx.categoria);
    setEditTipo(tx.tipo);
    setEditPagado(tx.pagado);
    setShowEditModal(true);
  };

  // Guardar cambios del movimiento editado
  const handleSaveEditedTx = async () => {
    if (!editingTx) return;
    if (!editDesc.trim() || !editMonto.trim()) {
      Alert.alert('Faltan datos', 'Por favor ingresa una descripción y un monto.');
      return;
    }
    const montoNum = parseMonto(editMonto);
    const updated = months.map(m => {
      if (m.id !== currentMonth.id) return m;
      return {
        ...m,
        movimientos: m.movimientos.map(tx => {
          if (tx.id !== editingTx.id) return tx;
          return {
            ...tx,
            descripcion: editDesc.trim(),
            monto: montoNum,
            categoria: editCat.trim() || 'Gastos fijos',
            tipo: editTipo,
            pagado: editPagado
          };
        })
      };
    });
    await updateMonthsStateAndCloud(updated);
    setShowEditModal(false);
    setEditingTx(null);
  };

  // Eliminar movimiento (Universal con confirmModal)
  const handleDeleteTx = (txId: string) => {
    openConfirm(
      'Eliminar Movimiento',
      '¿Estás seguro de que deseas eliminar este registro permanentemente?',
      async () => {
        const updated = months.map(m => {
          if (m.id !== currentMonth.id) return m;
          return {
            ...m,
            movimientos: m.movimientos.filter(tx => tx.id !== txId)
          };
        });
        await updateMonthsStateAndCloud(updated);
        setShowEditModal(false);
        setEditingTx(null);
      },
      'Eliminar'
    );
  };

  // Abrir modal para editar una meta
  const openEditMetaModal = (meta: MetaAhorro) => {
    setEditingMeta(meta);
    setEditMetaNombre(meta.nombre);
    setEditMetaMonto(String(meta.acumulado));
    setShowEditMetaModal(true);
  };

  // Guardar cambios de la meta
  const handleSaveMeta = async () => {
    if (!editingMeta) return;
    const montoNum = parseMonto(editMetaMonto);
    const updated = months.map(m => {
      if (m.id !== currentMonth.id) return m;
      return {
        ...m,
        metas: m.metas.map(meta => {
          if (meta.id !== editingMeta.id) return meta;
          return {
            ...meta,
            nombre: editMetaNombre.trim() || meta.nombre,
            acumulado: montoNum
          };
        })
      };
    });
    await updateMonthsStateAndCloud(updated);
    setShowEditMetaModal(false);
    setEditingMeta(null);
  };

  // Crear nueva meta de ahorro (hasta 3 o más metas)
  const handleCreateNewMeta = async () => {
    if (!newMetaName.trim()) {
      Alert.alert('Nombre requerido', 'Por favor ingresa un nombre para la nueva meta de ahorro.');
      return;
    }
    const amountNum = parseMonto(newMetaAmount);
    const newGoal: MetaAhorro = {
      id: 'meta_' + Date.now(),
      nombre: newMetaName.trim(),
      acumulado: amountNum
    };
    const updated = months.map(m => {
      if (m.id !== currentMonth.id) return m;
      return {
        ...m,
        metas: [...m.metas, newGoal]
      };
    });
    await updateMonthsStateAndCloud(updated);
    setShowNewMetaModal(false);
    setNewMetaName('');
    setNewMetaAmount('');
  };

  // Eliminar meta de ahorro (Universal con confirmModal)
  const handleDeleteMeta = (metaId: string) => {
    openConfirm(
      'Eliminar Meta de Ahorro',
      '¿Deseas eliminar esta meta de ahorro?',
      async () => {
        const updated = months.map(m => {
          if (m.id !== currentMonth.id) return m;
          return {
            ...m,
            metas: m.metas.filter(meta => meta.id !== metaId)
          };
        });
        await updateMonthsStateAndCloud(updated);
        setShowEditMetaModal(false);
        setEditingMeta(null);
      },
      'Eliminar Meta'
    );
  };

  // ==================== FASE 1: INGRESO A UN CLIC (NUMPAD) ====================
  const handleNumpadDigit = (digit: string) => {
    setNumpadAmount(prev => {
      if (prev === '0') return digit;
      if (prev.length >= 9) return prev;
      return prev + digit;
    });
  };

  const handleNumpadBackspace = () => {
    setNumpadAmount(prev => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const handleNumpadClear = () => {
    setNumpadAmount('0');
  };

  const handleNumpadQuickAdd = (addVal: number) => {
    setNumpadAmount(prev => {
      const current = Number(prev) || 0;
      return String(current + addVal);
    });
  };

  const handleSaveNumpadTransaction = async () => {
    const val = Number(numpadAmount) || 0;
    if (val <= 0) {
      Alert.alert('Monto inválido', 'Por favor ingresa un monto mayor a $0.');
      return;
    }
    const today = new Date();
    const assignedDate = `${monthYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(selectedDay || today.getDate()).padStart(2, '0')}`;
    const desc = numpadDesc.trim() || numpadCat;
    const newTx: Movimiento = {
      id: 'tx_' + Date.now(),
      tipo: numpadTipo,
      categoria: numpadCat,
      descripcion: desc,
      monto: val,
      pagado: numpadTipo === 'Ingreso' ? true : false,
      fecha: assignedDate
    };

    const updated = months.map(m => {
      if (m.id !== currentMonth.id) return m;
      return {
        ...m,
        movimientos: [newTx, ...m.movimientos]
      };
    });
    await updateMonthsStateAndCloud(updated);
    setNumpadAmount('0');
    setNumpadDesc('');
    setShowNumpadModal(false);
  };

  // ==================== FASE 2: GESTOR DE SUSCRIPCIONES ====================
  const totalSubsMensual = useMemo(() => {
    return suscripciones.filter(s => s.activo).reduce((acc, s) => acc + s.monto, 0);
  }, [suscripciones]);

  const totalSubsAnual = useMemo(() => {
    return totalSubsMensual * 12;
  }, [totalSubsMensual]);

  const handleCreateSuscripcion = async () => {
    if (!newSubNombre.trim() || !newSubMonto.trim()) {
      Alert.alert('Faltan datos', 'Por favor ingresa el nombre y el valor mensual de la suscripción.');
      return;
    }
    const montoNum = parseMonto(newSubMonto);
    const diaNum = Math.min(31, Math.max(1, parseInt(newSubDia, 10) || 15));
    const newSub: Suscripcion = {
      id: 'sub_' + Date.now(),
      nombre: newSubNombre.trim(),
      monto: montoNum,
      categoria: newSubCat,
      diaCobro: diaNum,
      emoji: getCategoryEmoji(newSubCat, 'Egreso'),
      activo: true
    };
    const updated = [...suscripciones, newSub];
    setSuscripciones(updated);
    await saveStoredSuscripciones(updated);
    setShowSubModal(false);
    setNewSubNombre('');
    setNewSubMonto('');
  };

  const handleDeleteSuscripcion = (id: string) => {
    openConfirm('Eliminar Suscripción', '¿Deseas eliminar este cobro recurrente?', async () => {
      const updated = suscripciones.filter(s => s.id !== id);
      setSuscripciones(updated);
      await saveStoredSuscripciones(updated);
    });
  };

  const handleToggleSuscripcion = async (id: string) => {
    const updated = suscripciones.map(s => s.id === id ? { ...s, activo: !s.activo } : s);
    setSuscripciones(updated);
    await saveStoredSuscripciones(updated);
  };

  const handleImportSubsToMonth = async () => {
    const activeSubs = suscripciones.filter(s => s.activo);
    if (activeSubs.length === 0) {
      Alert.alert('Sin suscripciones', 'No tienes suscripciones activas configuradas.');
      return;
    }
    const newTxs: Movimiento[] = activeSubs.map(s => ({
      id: 'tx_sub_' + s.id + '_' + Date.now(),
      tipo: 'Egreso',
      categoria: s.categoria,
      descripcion: `Suscripción: ${s.nombre}`,
      monto: s.monto,
      pagado: false,
      fecha: `${monthYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(s.diaCobro).padStart(2, '0')}`
    }));

    const updated = months.map(m => {
      if (m.id !== currentMonth.id) return m;
      return {
        ...m,
        movimientos: [...newTxs, ...m.movimientos]
      };
    });
    await updateMonthsStateAndCloud(updated);
    Alert.alert('Suscripciones Cargadas', `Se agregaron ${newTxs.length} suscripciones a los movimientos de ${currentMonth.nombre}.`);
  };

  // ==================== FASE 3: PRESUPUESTOS (ENVELOPES) ====================
  const handleOpenEditPresupuesto = (budget: PresupuestoCategoria, index: number) => {
    setEditingBudgetIndex(index);
    setBudgetCat(budget.categoria);
    setBudgetAmount(budget.limite.toString());
    setShowPresupuestoModal(true);
  };

  const handleOpenCreatePresupuesto = () => {
    setEditingBudgetIndex(null);
    setBudgetCat('Supermercado');
    setBudgetAmount('');
    setShowPresupuestoModal(true);
  };

  const handleSavePresupuesto = async () => {
    const limitNum = parseMonto(budgetAmount);
    if (limitNum <= 0) {
      Alert.alert('Monto inválido', 'Por favor ingresa un límite mensual mayor a $0.');
      return;
    }
    const cleanCat = budgetCat.trim() || 'General';
    let updated: PresupuestoCategoria[];
    if (editingBudgetIndex !== null && editingBudgetIndex >= 0 && editingBudgetIndex < presupuestos.length) {
      updated = presupuestos.map((p, idx) => idx === editingBudgetIndex ? { categoria: cleanCat, limite: limitNum } : p);
    } else {
      const existingIndex = (presupuestos || []).findIndex(p => String(p.categoria || '').toLowerCase() === cleanCat.toLowerCase());
      if (existingIndex >= 0) {
        updated = presupuestos.map((p, idx) => idx === existingIndex ? { ...p, limite: limitNum } : p);
      } else {
        updated = [...presupuestos, { categoria: cleanCat, limite: limitNum }];
      }
    }
    setPresupuestos(updated);
    await saveStoredPresupuestos(updated);
    if (userProfile && !userProfile.id.startsWith('user_')) {
      syncMonthsToFirestore(userProfile.id, months, { suscripciones, presupuestos: updated, deudas }).catch(() => {});
    }
    setShowPresupuestoModal(false);
    setEditingBudgetIndex(null);
    setBudgetAmount('');
  };

  const handleDeletePresupuesto = (cat: string) => {
    openConfirm('Eliminar Presupuesto', `¿Deseas eliminar el sobre de presupuesto para ${cat}?`, async () => {
      const updated = presupuestos.filter(p => p.categoria !== cat);
      setPresupuestos(updated);
      await saveStoredPresupuestos(updated);
    });
  };

  // ==================== FASE 4: PROYECCIÓN A FIN DE MES ====================
  const burnRateProjection = useMemo(() => {
    const now = new Date();
    const diaHoy = now.getDate();
    const diasEnMes = daysInMonth || 30;
    const cicloDia = currentMonth.cicloDiaInicio || 1;
    const isQuincenal = currentMonth.cicloFrecuencia === 'quincenal';

    let diasEnCiclo = diasEnMes;
    let diasTranscurridos = 1;
    let diasRestantes = 1;
    let cicloDesc = `Día ${diaHoy} de ${diasEnMes}`;

    if (isQuincenal) {
      diasEnCiclo = 15;
      if (diaHoy <= 15) {
        diasTranscurridos = Math.max(1, diaHoy);
        diasRestantes = Math.max(1, 15 - diaHoy);
        cicloDesc = `1ª Quincena (1 al 15) • Día ${diaHoy}/15`;
      } else {
        diasTranscurridos = Math.max(1, diaHoy - 15);
        diasRestantes = Math.max(1, diasEnMes - diaHoy);
        cicloDesc = `2ª Quincena (16 al ${diasEnMes}) • Día ${diaHoy - 15}/15`;
      }
    } else if (cicloDia === 1) {
      diasEnCiclo = diasEnMes;
      diasTranscurridos = Math.max(1, diaHoy);
      diasRestantes = Math.max(1, diasEnMes - diaHoy);
      cicloDesc = `Mes calendario (1 al ${diasEnMes}) • Día ${diaHoy}`;
    } else {
      // Ciclo personalizado, ej: día 15 al 14
      diasEnCiclo = 30;
      const diaFin = cicloDia === 1 ? diasEnMes : cicloDia - 1;
      if (diaHoy >= cicloDia) {
        diasTranscurridos = Math.max(1, diaHoy - cicloDia + 1);
        diasRestantes = Math.max(1, 30 - diasTranscurridos);
      } else {
        diasTranscurridos = Math.max(1, (30 - cicloDia + 1) + diaHoy);
        diasRestantes = Math.max(1, cicloDia - diaHoy);
      }
      cicloDesc = `Ciclo de pago (Día ${cicloDia} al ${diaFin}) • Día ${diasTranscurridos}/30`;
    }

    // Ritmo de gasto real diario: basado en egresos efectivamente pagados hasta la fecha
    const gastoPromedioDiario = egresosPagados > 0 ? (egresosPagados / Math.max(1, diasTranscurridos)) : 0;
    const egresosProyectados = egresosTotal;
    const totalIngresosParaProyeccion = ingresosTotal > 0 ? ingresosTotal : (Number(currentMonth.sueldoBase) || 0);
    const balanceProyectado = totalIngresosParaProyeccion - egresosTotal;
    // Límite diario seguro: dinero disponible real restando compromisos pendientes por pagar
    const disponibleParaVariables = Math.max(0, dineroDisponibleReal - egresosPendientes);
    const gastoDiarioSeguro = Math.max(0, disponibleParaVariables / Math.max(1, diasRestantes));
    const esPositivo = balanceProyectado >= 0;

    return {
      diaHoy,
      diasEnCiclo,
      diasTranscurridos,
      diasRestantes,
      cicloDesc,
      gastoPromedioDiario: Math.round(gastoPromedioDiario),
      egresosProyectados: Math.round(egresosProyectados),
      balanceProyectado: Math.round(balanceProyectado),
      gastoDiarioSeguro: Math.round(gastoDiarioSeguro),
      esPositivo
    };
  }, [daysInMonth, egresosPagados, egresosPendientes, egresosTotal, currentMonth.sueldoBase, currentMonth.cicloDiaInicio, currentMonth.cicloFrecuencia, ingresosTotal, dineroDisponibleReal]);

  // ==================== FASE 5: MANEJO DE DEUDAS ====================
  const totalSaldoDeudas = useMemo(() => {
    return deudas.reduce((acc, d) => acc + d.saldoTotal, 0);
  }, [deudas]);

  const totalCuotasMinimas = useMemo(() => {
    return deudas.reduce((acc, d) => acc + d.cuotaMinima, 0);
  }, [deudas]);

  const debtSimulation = useMemo(() => {
    if (totalSaldoDeudas <= 0 || totalCuotasMinimas <= 0) {
      return { mesesNormal: 0, mesesConExtra: 0, mesesAhorrados: 0, interesesAhorrados: 0 };
    }
    // Plazo realista basado en los plazos en meses configurados en cada crédito
    const plazos = deudas.map(d => d.plazoMeses || Math.ceil(d.saldoTotal / Math.max(1, d.cuotaMinima)));
    const maxPlazo = plazos.length > 0 ? Math.max(...plazos) : Math.ceil(totalSaldoDeudas / totalCuotasMinimas);
    const mesesNormal = Math.max(maxPlazo, Math.ceil(totalSaldoDeudas / totalCuotasMinimas));

    const cuotaConAbono = totalCuotasMinimas + abonoExtraMensual;
    const mesesConExtra = Math.max(1, Math.ceil(totalSaldoDeudas / cuotaConAbono));
    const mesesAhorrados = Math.max(0, mesesNormal - mesesConExtra);
    const tasaPromedioMensual = 0.02; // Aprox 2% mensual (24-28% anual)
    const interesEstimadoNormal = totalSaldoDeudas * tasaPromedioMensual * (mesesNormal / 2);
    const interesEstimadoExtra = totalSaldoDeudas * tasaPromedioMensual * (mesesConExtra / 2);
    const interesesAhorrados = Math.max(0, Math.round(interesEstimadoNormal - interesEstimadoExtra));

    return {
      mesesNormal,
      mesesConExtra,
      mesesAhorrados,
      interesesAhorrados
    };
  }, [totalSaldoDeudas, totalCuotasMinimas, abonoExtraMensual, deudas]);

  const handleOpenCreateDeuda = () => {
    setEditingDeudaId(null);
    setNewDeudaNombre('');
    setNewDeudaSaldo('');
    setNewDeudaCuota('');
    setNewDeudaTasa('28');
    setNewDeudaDia('17');
    setNewDeudaPlazo('12');
    setShowDeudaModal(true);
  };

  const handleOpenEditDeuda = (deuda: DeudaItem) => {
    setEditingDeudaId(deuda.id);
    setNewDeudaNombre(deuda.nombre);
    setNewDeudaSaldo(deuda.saldoTotal.toString());
    setNewDeudaCuota(deuda.cuotaMinima.toString());
    setNewDeudaTasa(deuda.tasaInteresAnual.toString());
    setNewDeudaDia(deuda.diaCorte.toString());
    setNewDeudaPlazo((deuda.plazoMeses || 12).toString());
    setShowDeudaModal(true);
  };

  const handleCreateDeuda = async () => {
    if (!newDeudaNombre.trim() || !newDeudaSaldo.trim()) {
      Alert.alert('Faltan datos', 'Por favor ingresa nombre y saldo total.');
      return;
    }
    const saldo = parseMonto(newDeudaSaldo);
    const plazo = parseInt(newDeudaPlazo, 10) || 12;
    const tasa = parseFloat(newDeudaTasa) || 28;
    const corte = parseInt(newDeudaDia, 10) || 17;
    let cuota = parseMonto(newDeudaCuota);
    if (cuota <= 0) {
      // Auto-cálculo de cuota mensual si se deja vacía: (saldo / plazo) + intereses
      const capital = saldo / plazo;
      const interes = saldo * (tasa / 1200);
      cuota = Math.round(capital + interes);
    }

    let updated: DeudaItem[];
    if (editingDeudaId) {
      updated = deudas.map(d => d.id === editingDeudaId ? {
        ...d,
        nombre: newDeudaNombre.trim(),
        saldoTotal: saldo,
        cuotaMinima: cuota,
        tasaInteresAnual: tasa,
        diaCorte: corte,
        plazoMeses: plazo
      } : d);
    } else {
      const newDeuda: DeudaItem = {
        id: 'deuda_' + Date.now(),
        nombre: newDeudaNombre.trim(),
        saldoTotal: saldo,
        cuotaMinima: cuota,
        tasaInteresAnual: tasa,
        diaCorte: corte,
        plazoMeses: plazo
      };
      updated = [...deudas, newDeuda];
    }

    setDeudas(updated);
    await saveStoredDeudas(updated);
    if (userProfile && !userProfile.id.startsWith('user_')) {
      syncMonthsToFirestore(userProfile.id, months, { suscripciones, presupuestos, deudas: updated }).catch(() => {});
    }
    setShowDeudaModal(false);
    setEditingDeudaId(null);
    setNewDeudaNombre('');
    setNewDeudaSaldo('');
    setNewDeudaCuota('');
    setNewDeudaPlazo('12');
  };

  const handleDeleteDeuda = (id: string) => {
    openConfirm('Eliminar Deuda', '¿Deseas eliminar este registro de deuda?', async () => {
      const updated = deudas.filter(d => d.id !== id);
      setDeudas(updated);
      await saveStoredDeudas(updated);
    });
  };

  // Añadir nuevo movimiento
  const handleAddTransaction = async () => {
    if (!newDesc.trim() || !newMonto.trim()) {
      Alert.alert('Faltan datos', 'Por favor ingresa la descripción y el monto.');
      return;
    }
    const montoNum = parseMonto(newMonto);
    const assignedDate = newTxDate || `${monthYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(selectedDay || new Date().getDate()).padStart(2, '0')}`;
    const newTx: Movimiento = {
      id: 'tx_' + Date.now(),
      tipo: newTipo,
      categoria: newCat.trim() || (newTipo === 'Ingreso' ? 'Ingreso Sueldo' : 'Supermercado'),
      descripcion: newDesc.trim(),
      monto: montoNum,
      pagado: newTipo === 'Ingreso' ? true : false,
      fecha: assignedDate
    };

    const updated = months.map(m => {
      if (m.id !== currentMonth.id) return m;
      return {
        ...m,
        movimientos: [newTx, ...m.movimientos]
      };
    });
    await updateMonthsStateAndCloud(updated);
    setNewDesc('');
    setNewMonto('');
    setNewTxDate('');
    setShowAddModal(false);
  };

  // Abrir configuración de Sueldo y Ciclo Financiero
  const openSetupModal = () => {
    setSetupSueldo(currentMonth.sueldoBase ? String(currentMonth.sueldoBase) : '3000000');
    setSetupCicloDia(currentMonth.cicloDiaInicio || 1);
    setSetupCicloFrecuencia(currentMonth.cicloFrecuencia || 'mensual');
    setSetupIngresoRecurrente(currentMonth.ingresoRecurrente !== false);
    setShowSetupModal(true);
  };

  // Guardar configuración de Sueldo Base y Ciclo Financiero
  const handleSaveSetup = async () => {
    const sueldoNum = parseMonto(setupSueldo);
    const updated = months.map(m => {
      if (m.id !== currentMonth.id) return m;
      const hasSueldoTx = (m.movimientos || []).some(tx => String(tx.categoria || '').toLowerCase().includes('sueldo') || String(tx.descripcion || '').toLowerCase().includes('sueldo'));
      let updatedMovimientos = m.movimientos || [];
      if (hasSueldoTx) {
        updatedMovimientos = (m.movimientos || []).map(tx => {
          if (String(tx.categoria || '').toLowerCase().includes('sueldo') || String(tx.descripcion || '').toLowerCase().includes('sueldo')) {
            return { ...tx, monto: sueldoNum };
          }
          return tx;
        });
      } else if (sueldoNum > 0) {
        const sueldoTx: Movimiento = {
          id: 'tx_sueldo_' + Date.now(),
          tipo: 'Ingreso',
          categoria: 'Ingreso Sueldo',
          descripcion: 'Sueldo o Ingreso principal',
          monto: sueldoNum,
          pagado: true
        };
        updatedMovimientos = [sueldoTx, ...m.movimientos];
      }
      return {
        ...m,
        sueldoBase: sueldoNum,
        cicloDiaInicio: Math.min(31, Math.max(1, setupCicloDia || 1)),
        cicloFrecuencia: setupCicloFrecuencia,
        ingresoRecurrente: setupIngresoRecurrente,
        movimientos: updatedMovimientos
      };
    });
    await updateMonthsStateAndCloud(updated);
    setShowSetupModal(false);
  };

  const AVATAR_EMOJI_PALETTE = ['🦁', '🚀', '🦊', '🐱', '👑', '💼', '⚡', '💎', '🥑', '🎯', '🐻', '🦉', '🦄', '🌟', '💰', '☕', '🏆', '🔥', '🧠', '👤'];

  // Guardar nuevo nombre de usuario (Compatible con modo local y sincronizado en la nube)
  const handleSaveUserName = async () => {
    if (!editUserName.trim()) {
      Alert.alert('Nombre requerido', 'Por favor ingresa un nombre válido.');
      return;
    }
    const cleanName = editUserName.trim();
    const baseProfile: UserProfile = userProfile || {
      id: 'user_local_' + Date.now(),
      nombre: cleanName,
      email: '',
      creadoEn: new Date().toISOString()
    };
    const updatedProfile: UserProfile = { ...baseProfile, nombre: cleanName };
    setUserProfile(updatedProfile);
    await saveStoredUserProfile(updatedProfile);
    if (userProfile && !userProfile.id.startsWith('user_')) {
      await updateUserProfileName(cleanName);
    }
    setIsEditingUserName(false);
    Alert.alert('¡Nombre actualizado!', `Tu nombre de usuario ahora es ${cleanName}.`);
  };

  // Seleccionar emoticon/avatar de perfil
  const handleSelectAvatarEmoji = async (emoji: string) => {
    const baseProfile: UserProfile = userProfile || {
      id: 'user_local_' + Date.now(),
      nombre: 'Usuario de Finanzas',
      email: '',
      creadoEn: new Date().toISOString()
    };
    const updatedProfile: UserProfile = { ...baseProfile, avatarEmoji: emoji };
    setUserProfile(updatedProfile);
    await saveStoredUserProfile(updatedProfile);
    await saveStoredAvatarEmoji(emoji);

    if (userProfile && !userProfile.id.startsWith('user_local_') && !userProfile.id.startsWith('user_')) {
      updateUserAvatarInFirestore(userProfile.id, emoji).catch(() => {});
      syncMonthsToFirestore(userProfile.id, months, { suscripciones, presupuestos, deudas, avatarEmoji: emoji }).catch(() => {});
    }
    setShowAvatarPickerModal(false);
  };

  // Renombrar Mes
  const handleOpenRenameMonth = (monthId: string, currentName: string) => {
    setMonthToRenameId(monthId);
    setRenameMonthInput(currentName);
    setShowRenameMonthModal(true);
  };

  const handleSaveRenameMonth = async () => {
    if (!renameMonthInput.trim()) {
      Alert.alert('Nombre requerido', 'Por favor ingresa un nombre para el mes.');
      return;
    }
    const cleanName = renameMonthInput.trim();
    const updated = months.map(m => m.id === monthToRenameId ? { ...m, nombre: cleanName, titulo: cleanName } : m);
    await updateMonthsStateAndCloud(updated);
    setShowRenameMonthModal(false);
    Alert.alert('¡Mes Renombrado!', `El mes se guardó como "${cleanName}".`);
  };

  // Cambiar Posición del FAB
  const handleChangeFabPosition = async (pos: FabPosition) => {
    setFabPosition(pos);
    await saveStoredFabPosition(pos);
  };

  const handleCycleFabPosition = async () => {
    const nextPos: FabPosition = fabPosition === 'derecha' ? 'izquierda' : fabPosition === 'izquierda' ? 'centro' : 'derecha';
    setFabPosition(nextPos);
    await saveStoredFabPosition(nextPos);
  };

  // Restablecer contraseña desde Perfil
  const handleSendPasswordResetFromProfile = async () => {
    if (!userProfile?.email) return;
    openConfirm(
      'Restablecer Contraseña',
      `¿Deseas enviar un enlace a ${userProfile.email} para cambiar tu contraseña?`,
      async () => {
        setAuthLoading(true);
        const res = await resetPasswordWithFirebase(userProfile.email);
        setAuthLoading(false);
        Alert.alert(res.success ? 'Enlace Enviado' : 'Aviso', res.message);
      },
      'Enviar Enlace'
    );
  };

  // Restablecer contraseña desde Formulario de Olvido (sin login)
  const handleForgotSubmit = async () => {
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      Alert.alert('Correo requerido', 'Ingresa un correo electrónico válido.');
      return;
    }
    setAuthLoading(true);
    const res = await resetPasswordWithFirebase(forgotEmail);
    setAuthLoading(false);
    Alert.alert(res.success ? 'Revisa tu Correo' : 'Aviso', res.message);
    if (res.success) {
      setAuthTab('login');
    }
  };

  // Duplicar mes / Crear nuevo mes
  const handleDuplicateMonth = async () => {
    const updated = await duplicateMonth(currentMonth.id, dupName.trim() || undefined);
    setMonths(updated);
    setDupName('');
    setShowMonthModal(false);
    if (userProfile && userProfile.id) {
      syncMonthsToFirestore(userProfile.id, updated).catch(() => {});
    }
    Alert.alert('¡Nuevo Mes Creado!', 'Se duplicaron tus compromisos fijos con estado pendiente para este nuevo periodo.');
  };

  // Escáner: Pegar directamente desde portapapeles con 1 toque
  const handlePasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (!text || !text.trim()) {
        Alert.alert('Portapapeles Vacío', 'Copia primero una notificación bancaria o SMS y vuelve a tocar aquí.');
        return;
      }
      setPastedNotification(text);
      const detected = parseColombianNotification(text);
      if (!detected || detected.monto <= 0) {
        Alert.alert(
          'Texto pegado',
          'Se pegó el texto, pero no encontramos un monto claro. Puedes verificar que sea una notificación de Bancolombia, Nu, Davivienda, Falabella, Nequi o PSE.'
        );
        return;
      }
      setDetectedNotifications(prev => [detected, ...prev]);
    } catch (e) {
      Alert.alert('Error', 'No se pudo acceder al portapapeles.');
    }
  };

  // Escáner: Probar ejemplo rápido
  const handleLoadSample = (sampleText: string) => {
    setPastedNotification(sampleText);
    const detected = parseColombianNotification(sampleText);
    if (detected) {
      setDetectedNotifications(prev => [detected, ...prev]);
    }
  };

  // Escáner: Analizar texto manual
  const handleAnalyzeNotification = () => {
    if (!pastedNotification.trim()) {
      Alert.alert('Texto vacío', 'Pega el texto de tu banco o toca "Pegar desde Portapapeles".');
      return;
    }
    const detected = parseColombianNotification(pastedNotification);
    if (!detected || detected.monto <= 0) {
      Alert.alert('No detectado', 'No se reconoció un formato bancario válido. Intenta con una notificación de Bancolombia, Nu, Davivienda o Nequi.');
      return;
    }
    setDetectedNotifications(prev => [detected, ...prev]);
    setPastedNotification('');
  };

  // Escáner: Importar movimiento detectado al mes
  const handleImportDetectedToMonth = async (item: MovimientoBancarioDetectado) => {
    const newTx: Movimiento = {
      id: 'tx_bank_' + Date.now(),
      tipo: item.tipo,
      categoria: item.categoriaSugerida,
      descripcion: item.descripcionSugerida,
      monto: item.monto,
      pagado: true,
      medio: item.medio
    };

    const updated = months.map(m => {
      if (m.id !== currentMonth.id) return m;
      return {
        ...m,
        movimientos: [newTx, ...m.movimientos]
      };
    });
    await updateMonthsStateAndCloud(updated);
    setDetectedNotifications(prev => prev.map(d => d.id === item.id ? { ...d, imported: true } : d));
    Alert.alert('¡Agregado!', `Se añadió "${item.descripcionSugerida}" por ${formatCOP(item.monto)} a ${currentMonth.nombre}.`);
  };

  // Escáner: Eliminar/Descartar una notificación detectada
  const handleDeleteDetected = (id: string) => {
    setDetectedNotifications(prev => prev.filter(d => d.id !== id));
  };

  // Escáner: Limpiar todas las notificaciones detectadas (Universal con confirmModal)
  const handleClearAllDetected = () => {
    if (detectedNotifications.length === 0) return;
    openConfirm(
      'Limpiar Lista',
      '¿Deseas eliminar todas las notificaciones escaneadas de la lista?',
      () => setDetectedNotifications([]),
      'Limpiar Todo'
    );
  };

  // Autenticación con Firebase: Crear Cuenta
  const handleRegisterAccount = async () => {
    setAuthLoading(true);
    const localEmoji = await getStoredAvatarEmoji();
    const currentAvatar = userProfile?.avatarEmoji || localEmoji || undefined;
    const res = await registerWithFirebase(regName, regEmail, regPassword, currentAvatar);
    setAuthLoading(false);

    if (!res.success || !res.user) {
      Alert.alert('No se pudo crear la cuenta', res.message || 'Verifica los datos ingresados.');
      return;
    }

    if (currentAvatar) {
      res.user.avatarEmoji = currentAvatar;
      await saveStoredAvatarEmoji(currentAvatar);
    }

    await saveStoredUserProfile(res.user);
    setUserProfile(res.user);
    // Sincronizar meses iniciales y avatar con Cloud Firestore
    syncMonthsToFirestore(res.user.id, months, {
      suscripciones,
      presupuestos,
      deudas,
      avatarEmoji: currentAvatar
    }).catch(() => {});

    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setShowAuthModal(false);
    Alert.alert(
      '¡Cuenta Creada con Éxito! 🎉',
      `Bienvenido ${res.user.nombre}. Tu cuenta, tu avatar y tus finanzas ya están respaldadas en tiempo real en la nube.`
    );
  };

  // Autenticación: Iniciar Sesión
  const handleLoginAccount = async () => {
    setAuthLoading(true);
    const res = await loginWithFirebase(loginEmail, loginPassword);
    setAuthLoading(false);

    if (!res.success || !res.user) {
      Alert.alert('Error al iniciar sesión', res.message || 'Credenciales no válidas.');
      return;
    }

    // Persistencia y restauración del Avatar / Emoticon
    if (res.user.avatarEmoji) {
      await saveStoredAvatarEmoji(res.user.avatarEmoji);
    } else {
      const localEmoji = await getStoredAvatarEmoji();
      if (localEmoji) {
        res.user.avatarEmoji = localEmoji;
        updateUserAvatarInFirestore(res.user.id, localEmoji).catch(() => {});
      }
    }

    // Si tiene datos respaldados en Cloud Firestore, restaurarlos completamente
    if (res.cloudMonths && res.cloudMonths.length > 0) {
      setMonths(res.cloudMonths);
      await saveStoredMonths(res.cloudMonths);
      if (res.cloudMonths[0]?.id) {
        setActiveId(res.cloudMonths[0].id);
      }
    } else {
      // Si la nube estaba vacía, subir los datos locales
      syncMonthsToFirestore(res.user.id, months, {
        suscripciones,
        presupuestos,
        deudas,
        avatarEmoji: res.user.avatarEmoji
      }).catch(() => {});
    }

    if (res.cloudExtra) {
      if (res.cloudExtra.suscripciones && res.cloudExtra.suscripciones.length > 0) {
        setSuscripciones(res.cloudExtra.suscripciones);
        await saveStoredSuscripciones(res.cloudExtra.suscripciones);
      }
      if (res.cloudExtra.presupuestos && res.cloudExtra.presupuestos.length > 0) {
        setPresupuestos(res.cloudExtra.presupuestos);
        await saveStoredPresupuestos(res.cloudExtra.presupuestos);
      }
      if (res.cloudExtra.deudas && res.cloudExtra.deudas.length > 0) {
        setDeudas(res.cloudExtra.deudas);
        await saveStoredDeudas(res.cloudExtra.deudas);
      }
      if (!res.user.avatarEmoji && res.cloudExtra.avatarEmoji) {
        res.user.avatarEmoji = res.cloudExtra.avatarEmoji;
        await saveStoredAvatarEmoji(res.cloudExtra.avatarEmoji);
      }
    }

    await saveStoredUserProfile(res.user);
    setUserProfile(res.user);
    setLoginEmail('');
    setLoginPassword('');
    setShowAuthModal(false);
    Alert.alert(
      '¡Bienvenido de nuevo! 👋',
      `Has iniciado sesión como ${res.user.nombre}. Tus finanzas y tu avatar han sido restaurados con éxito desde la nube.`
    );
  };

  // Autenticación: Cerrar Sesión (Privacidad Total: Limpieza a $0 en pantalla y almacenamiento local)
  const handleLogout = () => {
    openConfirm(
      'Cerrar Sesión 🔒',
      '¿Deseas cerrar tu sesión actual? Tus datos están guardados de forma segura en la nube. Al cerrar sesión, los datos en pantalla y del dispositivo se restablecerán a $0 para garantizar tu privacidad ante terceros.',
      async () => {
        try {
          await logoutFromFirebase();
        } catch (e) {}

        // 1. Limpiar perfil activo
        await saveStoredUserProfile(null);
        setUserProfile(null);

        // 2. Restablecer meses y datos financieros a valores limpios en 0
        const cleanInitialMonth: MesFinanciero = {
          id: 'mes_actual',
          nombre: getMonthYearDisplay(),
          titulo: `Presupuesto ${getMonthYearDisplay()}`,
          sueldoBase: 0,
          metas: [
            { id: 'meta_1', nombre: 'Fondo de Emergencia', acumulado: 0 },
            { id: 'meta_2', nombre: 'Meta Principal (Ahorro / Inversión)', acumulado: 0 }
          ],
          movimientos: []
        };

        setMonths([cleanInitialMonth]);
        setActiveId('mes_actual');
        setPresupuestos([]);
        setDeudas([]);
        setSuscripciones([]);
        setDetectedNotifications([]);

        // 3. Limpiar almacenamiento local para que no quede expuesto a otros en el dispositivo
        await saveStoredMonths([cleanInitialMonth]);
        await saveStoredPresupuestos([]);
        await saveStoredDeudas([]);
        await saveStoredSuscripciones([]);

        setShowAuthModal(false);
        setHubTab('resumen');

        Alert.alert(
          'Sesión Cerrada 🔒',
          'Has cerrado sesión de forma segura. La información privada ha sido retirada de la pantalla y tus datos permanecen protegidos en tu cuenta de la nube.'
        );
      },
      'Cerrar Sesión'
    );
  };

  // Sincronización Manual de Respaldo en la Nube
  const handleManualSync = async () => {
    if (!userProfile) return;
    const res = await syncMonthsToFirestore(userProfile.id, months, {
      suscripciones,
      presupuestos,
      deudas,
      avatarEmoji: userProfile.avatarEmoji
    });
    if (res.success) {
      if (userProfile.avatarEmoji) {
        updateUserAvatarInFirestore(userProfile.id, userProfile.avatarEmoji).catch(() => {});
      }
      const updated: UserProfile = {
        ...userProfile,
        ultimaSincronizacion: new Date().toISOString()
      };
      await saveStoredUserProfile(updated);
      setUserProfile(updated);
      Alert.alert('¡Sincronización Exitosa! ☁️', `Todos tus datos y avatar están respaldados en tiempo real en la nube.`);
    } else {
      Alert.alert('Aviso de Sincronización', res.message || 'No se pudo conectar con el servidor en la nube. Revisa tu conexión.');
    }
  };

  // Migración de cuenta local previa a la Nube
  const handleMigrateLocalToFirebase = async () => {
    if (!userProfile) return;
    if (!regPassword || regPassword.trim().length < 6) {
      Alert.alert('Contraseña requerida', 'Por favor ingresa una contraseña de mínimo 6 caracteres para respaldar tu cuenta en la nube.');
      return;
    }
    setAuthLoading(true);
    let res = await registerWithFirebase(userProfile.nombre, userProfile.email, regPassword.trim());
    // Si ya existe la cuenta en la nube, intentar inicio de sesión
    if (!res.success && (res.message?.includes('Ya existe') || res.message?.includes('already-in-use'))) {
      const loginRes = await loginWithFirebase(userProfile.email, regPassword.trim());
      if (loginRes.success && loginRes.user) {
        res = { success: true, user: loginRes.user };
      }
    }
    setAuthLoading(false);

    if (!res.success || !res.user) {
      Alert.alert('No se pudo vincular a la nube', res.message || 'Verifica los datos.');
      return;
    }

    await saveStoredUserProfile(res.user);
    setUserProfile(res.user);
    // Subir todos los datos actuales a la nube
    const syncRes = await syncMonthsToFirestore(res.user.id, months, { suscripciones, presupuestos, deudas });
    setRegPassword('');
    if (syncRes.success) {
      Alert.alert(
        '¡Sincronización en la Nube Exitosa! 🎉☁️',
        `Tus finanzas han sido respaldadas en la nube. Ahora puedes ingresar con tu correo ${res.user.email} en cualquier celular o computador.`
      );
    } else {
      Alert.alert(
        '¡Cuenta Vinculada en la Nube!',
        `Tu cuenta fue vinculada. Nota: ${syncRes.message || 'Datos guardados'}.`
      );
    }
  };

  // Exportar Excel
  const handleExportExcel = () => {
    try {
      const base64 = generateExcelWorkbook(currentMonth);
      if (Platform.OS === 'web') {
        downloadExcelWeb(base64, `ContamePues_Finanzas_${currentMonth.nombre.replace(/[\/\s]/g, '_')}.xlsx`);
        Alert.alert('Descargando', 'Tu archivo Excel se ha descargado.');
      } else {
        Share.share({
          title: 'Exportar Finanzas Contame Pues',
          message: `Reporte Financiero ${currentMonth.nombre}\n• Ingresos: ${formatCOP(ingresosTotal)}\n• Egresos: ${formatCOP(egresosTotal)}\n• Dinero Libre: ${formatCOP(dineroLibre)}`
        });
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo generar el archivo Excel.');
    }
  };

  // Categorías y Filtros (Deduplicadas, Normalizadas y con Desglose Pagado vs Pendiente en Tiempo Real)
  const categoryMap = useMemo(() => {
    const map = new Map<string, { categoria: string; total: number; pagado: number; pendiente: number; count: number }>();
    egresosList.forEach(tx => {
      const cleanCat = (tx.categoria || 'Gastos fijos').trim();
      const key = cleanCat.toLowerCase();
      const existing = map.get(key) || { categoria: cleanCat, total: 0, pagado: 0, pendiente: 0, count: 0 };
      existing.total += tx.monto;
      existing.count += 1;
      if (tx.pagado) {
        existing.pagado += tx.monto;
      } else {
        existing.pendiente += tx.monto;
      }
      map.set(key, existing);
    });
    return map;
  }, [egresosList]);

  const uniqueCategories = useMemo(() => {
    return Array.from(categoryMap.values()).map(c => c.categoria);
  }, [categoryMap]);

  const categoryBreakdown = useMemo(() => {
    return Array.from(categoryMap.values()).map(item => {
      const pct = egresosTotal > 0 ? ((item.total / egresosTotal) * 100).toFixed(1) : '0';
      const pctPagado = item.total > 0 ? Math.round((item.pagado / item.total) * 100) : 0;
      return {
        ...item,
        pct: Number(pct),
        pctPagado
      };
    }).sort((a, b) => b.total - a.total);
  }, [categoryMap, egresosTotal]);

  const filteredMovimientos = (currentMonth?.movimientos || []).filter(t => {
    if (!t) return false;
    // 1. Filtro por día seleccionado en el Calendario
    if (selectedDay !== null) {
      const day = getTxDay(t, monthYear, monthIndex);
      if (day !== selectedDay) return false;
    }

    // 2. Filtro por rango de fechas (7, 15, 30, 60 días)
    if (dateRangeFilter !== 'ALL') {
      const daysLimit = dateRangeFilter === '7D' ? 7 : dateRangeFilter === '15D' ? 15 : dateRangeFilter === '30D' ? 30 : 60;
      let txTime = 0;
      if (t.fecha) {
        txTime = new Date(t.fecha).getTime();
      } else {
        const parts = String(t.id || '').split('_');
        if (parts.length > 1 && !isNaN(Number(parts[1]))) {
          txTime = Number(parts[1]);
        }
      }
      if (txTime > 0) {
        const diffDays = (Date.now() - txTime) / (1000 * 60 * 60 * 24);
        if (diffDays > daysLimit || diffDays < -1) return false;
      }
    }

    // 3. Filtros por categoría y estado
    const tipoStr = String(t.tipo || '').toLowerCase();
    const catStr = String(t.categoria || '');
    const descStr = String(t.descripcion || '');

    if (selectedCategoryChip === 'ONLY_INGRESOS' && tipoStr !== 'ingreso') return false;
    if (selectedCategoryChip !== 'ALL' && selectedCategoryChip !== 'ONLY_INGRESOS' && catStr !== selectedCategoryChip) return false;
    if (filterStatus === 'PENDING' && t.pagado) return false;
    if (filterStatus === 'PAID' && !t.pagado) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!descStr.toLowerCase().includes(q) && !catStr.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Segmentación para limpiar ruido visual: Pendientes vs Pagadas vs Ingresos Recibidos
  const movimientosPendientes = useMemo(() => {
    return filteredMovimientos.filter(t => !t.pagado);
  }, [filteredMovimientos]);

  const ingresosRecibidos = useMemo(() => {
    return filteredMovimientos.filter(t => String(t.tipo || '').toLowerCase() === 'ingreso' && Boolean(t.pagado));
  }, [filteredMovimientos]);

  const totalMontoIngresosRecibidos = useMemo(() => {
    return ingresosRecibidos.reduce((sum, t) => sum + (Number(t.monto) || 0), 0);
  }, [ingresosRecibidos]);

  const movimientosPagados = useMemo(() => {
    return filteredMovimientos.filter(t => String(t.tipo || '').toLowerCase() !== 'ingreso' && Boolean(t.pagado));
  }, [filteredMovimientos]);

  const totalMontoPagados = useMemo(() => {
    return movimientosPagados.reduce((sum, t) => sum + (Number(t.monto) || 0), 0);
  }, [movimientosPagados]);

  const renderCalendarCard = (isSidebar: boolean = false) => (
    <View style={[styles.calendarCard, { backgroundColor: theme.card, borderColor: theme.border }, isSidebar && { marginTop: 0 }, theme.shadow]}>
      <View style={styles.calendarHeaderRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
          <Text style={{ fontSize: 16 }}>📅</Text>
          <Text style={[styles.calendarTitle, { color: theme.text }]}>
            {MESES_ES[monthIndex]} {monthYear}
          </Text>
        </View>
        {selectedDay !== null && (
          <TouchableOpacity onPress={() => setSelectedDay(null)} style={styles.btnClearDayFilter}>
            <Text style={{ fontSize: 11, color: theme.green, fontWeight: '700' }}>Ver todo el mes ✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Días de la semana */}
      <View style={styles.calendarWeekdaysRow}>
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d, i) => (
          <Text key={i} style={[styles.calendarWeekdayText, { color: theme.muted }]}>{d}</Text>
        ))}
      </View>

      {/* Matriz de días del mes */}
      <View style={styles.calendarGrid}>
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <View key={`empty_${i}`} style={styles.calendarDayCellEmpty} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const isSelected = selectedDay === dayNum;
          const dayInfo = txsByDay[dayNum];
          return (
            <TouchableOpacity
              key={`day_${dayNum}`}
              style={[
                styles.calendarDayCell,
                {
                  backgroundColor: isSelected ? theme.green : theme.bg,
                  borderColor: isSelected ? theme.green : theme.border
                }
              ]}
              onPress={() => setSelectedDay(prev => prev === dayNum ? null : dayNum)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.calendarDayNum,
                  { color: isSelected ? '#FFFFFF' : theme.text, fontWeight: isSelected ? '900' : '600' }
                ]}
              >
                {dayNum}
              </Text>
              <View style={styles.calendarDotsRow}>
                {dayInfo?.hasIngreso && (
                  <View style={[styles.calendarDot, { backgroundColor: isSelected ? '#FFFFFF' : theme.green }]} />
                )}
                {dayInfo?.hasEgreso && (
                  <View style={[styles.calendarDot, { backgroundColor: isSelected ? '#FFFFFF' : theme.red }]} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Barra de acción rápida del día */}
      <View style={styles.calendarFooterRow}>
        {selectedDay !== null ? (
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: theme.text, fontWeight: '700' }}>
              Día {selectedDay}: {txsByDay[selectedDay]?.count || 0} movimientos
            </Text>
            <TouchableOpacity
              style={[styles.btnAddDayTx, { backgroundColor: theme.green }]}
              onPress={() => {
                setNewTipo('Egreso');
                setNewDesc('');
                setNewMonto('');
                setNewCat('Supermercado');
                const dateStr = `${monthYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
                setNewTxDate(dateStr);
                setShowAddModal(true);
              }}
            >
              <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>＋ Gasto en día {selectedDay}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={{ fontSize: 11, color: theme.muted, textAlign: 'center', width: '100%' }}>
            Toca cualquier día para filtrar o registrar movimientos de esa fecha
          </Text>
        )}
      </View>
    </View>
  );

  const renderRightSidebarContent = () => (
    <>
      {/* SECCIÓN 1: FONDOS Y METAS DE AHORRO (COLAPSABLE & DINÁMICA) */}
      <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }, theme.shadow]}>
        <TouchableOpacity
          style={styles.sectionHeaderRow}
          onPress={() => setIsGoalsExpanded(prev => !prev)}
          activeOpacity={0.7}
        >
          <View style={{ flex: 1, paddingRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.sectionHeading, { color: theme.text }]} numberOfLines={1}>
                🏦 Fondos y Metas ({currentMonth.metas.length})
              </Text>
              <Text style={{ fontSize: 13, color: theme.green, fontWeight: '800' }}>
                {isGoalsExpanded ? '▲' : '▼'}
              </Text>
            </View>
            <Text style={[styles.sectionSubHeading, { color: theme.muted }]} numberOfLines={1}>
              {isGoalsExpanded ? 'Toca cualquier meta para editar su saldo' : 'Toca para expandir tus metas de ahorro'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                toggleSectionPrivacy('metas');
              }}
              style={{ paddingHorizontal: 7, paddingVertical: 4, borderRadius: 999, backgroundColor: theme.cardSubtle, borderWidth: 1, borderColor: theme.border }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ fontSize: 12 }}>{privacySections.metas ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
            <View style={[styles.totalGoalsBadge, { backgroundColor: theme.greenSoft }]}>
              <Text style={[styles.totalGoalsText, { color: theme.green }]}>
                {formatMetas(totalFondos)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {isGoalsExpanded && (
          <View style={styles.goalsList}>
            {(currentMonth?.metas || []).map((meta) => (
              <TouchableOpacity
                key={meta.id}
                style={[styles.goalCardItem, { backgroundColor: theme.bg, borderColor: theme.border }]}
                onPress={() => openEditMetaModal(meta)}
                activeOpacity={0.7}
              >
                <View style={styles.goalCardLeft}>
                  <Text style={styles.goalEmoji}>
                    {String(meta.nombre || '').toLowerCase().includes('emergencia') ? '🛡️' : String(meta.nombre || '').toLowerCase().includes('inversion') ? '📈' : '🎯'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.goalName, { color: theme.text }]} numberOfLines={1}>{meta.nombre}</Text>
                    <Text style={[styles.goalSub, { color: theme.muted }]}>Toca para modificar</Text>
                  </View>
                </View>
                <View style={styles.goalCardRight}>
                  <Text style={[styles.goalAmount, { color: theme.text }]}>{formatMetas(meta.acumulado)}</Text>
                  <Text style={{ fontSize: 12, color: theme.muted }}>✏️</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Botón para agregar una nueva meta (hasta 3 o más) */}
            <TouchableOpacity
              style={[styles.btnAddGoal, { backgroundColor: theme.cardSubtle, borderColor: theme.border }]}
              onPress={() => {
                setNewMetaName('');
                setNewMetaAmount('');
                setShowNewMetaModal(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.btnAddGoalText, { color: theme.green }]}>
                ＋ Agregar Otra Meta de Ahorro
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* FASE 3: PRESUPUESTOS POR CATEGORÍA (MÉTODO ENVELOPES / SOBRES) */}
      <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }, theme.shadow]}>
        <TouchableOpacity
          style={styles.sectionHeaderRow}
          onPress={() => setIsEnvelopesExpanded(prev => !prev)}
          activeOpacity={0.7}
        >
          <View style={{ flex: 1, paddingRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.sectionHeading, { color: theme.text }]}>✉️ Presupuestos por Categoría ({presupuestos.length})</Text>
              <Text style={{ fontSize: 13, color: theme.green, fontWeight: '800' }}>
                {isEnvelopesExpanded ? '▲' : '▼'}
              </Text>
            </View>
            <Text style={[styles.sectionSubHeading, { color: theme.muted }]}>
              {isEnvelopesExpanded ? 'Topes de gasto para evitar compras impulsivas' : 'Toca para ver el avance de tus sobres'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.btnAddTxSmall, { backgroundColor: theme.green }]}
            onPress={handleOpenCreatePresupuesto}
          >
            <Text style={styles.btnAddTxSmallText}>＋ Fijar</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {isEnvelopesExpanded && (
          <View style={{ gap: 12 }}>
            {(presupuestos || []).map((budget, idx) => {
              const cleanBudgetCat = String(budget.categoria || '').trim().toLowerCase();
              const isCatMatch = (tx: Movimiento) => {
                if (!tx) return false;
                if ((tx.tipo || '').toLowerCase() === 'ingreso') return false;
                if (!cleanBudgetCat) return false;
                const txCat = String(tx.categoria || '').trim().toLowerCase();
                const txDesc = String(tx.descripcion || '').trim().toLowerCase();
                return (
                  txCat === cleanBudgetCat ||
                  (cleanBudgetCat.length >= 3 && txCat.includes(cleanBudgetCat)) ||
                  (txCat.length >= 3 && cleanBudgetCat.includes(txCat)) ||
                  (cleanBudgetCat.length >= 3 && txDesc.includes(cleanBudgetCat))
                );
              };

              const matchingTxs = (currentMonth?.movimientos || []).filter(isCatMatch);
              const pagadoSobre = matchingTxs.filter(tx => Boolean(tx.pagado)).reduce((acc, tx) => acc + (Number(tx.monto) || 0), 0);
              const pendienteSobre = matchingTxs.filter(tx => !tx.pagado).reduce((acc, tx) => acc + (Number(tx.monto) || 0), 0);
              const totalGastadoSobre = pagadoSobre + pendienteSobre;

              const limiteNum = Number(budget.limite) || 0;
              const pctPagadoSobre = limiteNum > 0 ? Math.min(100, Math.max(0, Math.round((pagadoSobre / limiteNum) * 100))) : 0;
              const pctTotalSobre = limiteNum > 0 ? Math.min(100, Math.max(0, Math.round((totalGastadoSobre / limiteNum) * 100))) : 0;
              const disponibleRealSobre = Math.max(0, limiteNum - pagadoSobre);
              const colorBar = pctTotalSobre > 100 ? theme.red : pctTotalSobre >= 75 ? theme.amber : theme.green;

              return (
                <View key={idx} style={[styles.budgetEnvelopeCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}
                      onPress={() => handleOpenEditPresupuesto(budget, idx)}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 20 }}>{getCategoryEmoji(budget.categoria, 'Egreso')}</Text>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.goalName, { color: theme.text }]} numberOfLines={1}>{budget.categoria}</Text>
                          <Text style={{ fontSize: 11, color: theme.green, fontWeight: '700' }}>✏️</Text>
                        </View>
                        <Text style={{ fontSize: 11, color: theme.muted }}>
                          {pagadoSobre > 0
                            ? `Pagado: ${formatCOP(pagadoSobre)} de ${formatCOP(limiteNum)}${pendienteSobre > 0 ? ` • ${formatCOP(pendienteSobre)} pendientes` : ''}`
                            : pendienteSobre > 0
                            ? `Pendiente: ${formatCOP(pendienteSobre)} de ${formatCOP(limiteNum)} (Por pagar)`
                            : `Disponible: ${formatCOP(limiteNum)} (Sin gastos)`}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <TouchableOpacity
                        onPress={() => handleOpenEditPresupuesto(budget, idx)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={{ padding: 4 }}
                        accessibilityLabel="Editar categoría"
                      >
                        <Text style={{ fontSize: 13, color: theme.green }}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeletePresupuesto(budget.categoria)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={{ padding: 4 }}
                        accessibilityLabel="Eliminar presupuesto"
                      >
                        <Text style={{ fontSize: 14, color: theme.muted }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Barra de progreso interactiva (Pagado vs Pendiente) */}
                  <View style={[styles.categoryTrack, { backgroundColor: theme.cardSubtle, height: 8, marginVertical: 4, position: 'relative', overflow: 'hidden' }]}>
                    <View style={[styles.categoryBarFill, { width: `${pctTotalSobre}%`, backgroundColor: '#FDE68A', opacity: 0.6 }]} />
                    <View style={[styles.categoryBarFill, { position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pctPagadoSobre}%`, backgroundColor: colorBar }]} />
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colorBar }}>
                      {pctPagadoSobre}% pagado {pendienteSobre > 0 ? `(${pctTotalSobre}% con pendientes)` : ''}
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: totalGastadoSobre > limiteNum ? theme.red : theme.text }}>
                      {totalGastadoSobre > limiteNum
                        ? `Excedido por ${formatCOP(totalGastadoSobre - limiteNum)}`
                        : `${formatCOP(disponibleRealSobre)} restante`}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* SECCIÓN 2: DISTRIBUCIÓN DE GASTOS (COLAPSABLE & DINÁMICA) */}
      <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }, theme.shadow]}>
        <TouchableOpacity
          style={styles.sectionHeaderRow}
          onPress={() => setIsDistributionExpanded(prev => !prev)}
          activeOpacity={0.7}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.sectionHeading, { color: theme.text }]}>📊 Distribución de Gastos</Text>
              <Text style={{ fontSize: 13, color: theme.green, fontWeight: '800' }}>
                {isDistributionExpanded ? '▲' : '▼'}
              </Text>
            </View>
            <Text style={[styles.sectionSubHeading, { color: theme.muted }]}>
              {isDistributionExpanded ? 'Desglose porcentual del presupuesto' : 'Toca para ver el desglose por categorías'}
            </Text>
          </View>
        </TouchableOpacity>

        {isDistributionExpanded && (
          <View style={styles.categoryBreakdownList}>
            {categoryBreakdown.map((cat, idx) => (
              <View key={idx} style={styles.categoryItemRow}>
                <View style={styles.categoryTextRow}>
                  <Text style={[styles.categoryName, { color: theme.text }]}>
                    {getCategoryEmoji(cat.categoria, 'Egreso')} {cat.categoria}
                  </Text>
                  <Text style={[styles.categoryNumbers, { color: theme.text }]}>
                    {formatCOP(cat.total)} <Text style={{ color: theme.muted, fontWeight: '600' }}>({cat.pct}%)</Text>
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ fontSize: 10, color: theme.muted }}>
                    Pagado: <Text style={{ color: theme.green, fontWeight: '700' }}>{formatCOP(cat.pagado)}</Text> ({cat.pctPagado}%)
                  </Text>
                  {cat.pendiente > 0 ? (
                    <Text style={{ fontSize: 10, color: theme.amber, fontWeight: '700' }}>
                      Por pagar: {formatCOP(cat.pendiente)}
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 10, color: theme.green, fontWeight: '700' }}>
                      ✓ 100% al día
                    </Text>
                  )}
                </View>
                <View style={[styles.categoryTrack, { backgroundColor: theme.bg, height: 7 }]}>
                  <View style={[styles.categoryBarFill, { width: `${cat.pct}%`, backgroundColor: cat.pctPagado === 100 ? theme.green : theme.amber }]} />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top', 'left', 'right']}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />

      {/* TOPBAR MODERNA */}
      <View style={styles.topbar}>
        <View style={styles.topbarMainRow}>
          {/* Logo Oficial Contame Pues + Asesoría WhatsApp */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity
              style={styles.logoTouch}
              onPress={() => {
                if (Platform.OS === 'web') {
                  Linking.openURL('https://contamepues.com/');
                } else {
                  setHubTab('resumen');
                }
              }}
              activeOpacity={0.8}
              accessibilityLabel="Ir a contamepues.com"
            >
              <Image
                source={require('./assets/logo.webp')}
                style={isDesktop ? styles.brandLogoImage : styles.brandLogoImageMobile}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* BOTÓN ASESORÍA OFICIAL CONTAME PUES */}
            <TouchableOpacity
              style={styles.asesoriaBtn}
              onPress={() => Linking.openURL('https://api.whatsapp.com/send?phone=573115417101&text=Buen%20d%C3%ADa%2C%20quiero%20saber%20m%C3%A1s%20de%20tus%20servicios.')}
              activeOpacity={0.8}
              accessibilityLabel="Asesoría SST Contame Pues"
            >
              <Text style={styles.asesoriaBtnText}>Asesoría 💬</Text>
            </TouchableOpacity>
          </View>

          {/* NAVEGACIÓN DESKTOP SAAS (SOLO EN PANTALLA ANCHA) */}
          {isDesktop && (
            <View style={[styles.desktopNavTabs, { backgroundColor: theme.cardSubtle, borderColor: theme.border }]}>
              <TouchableOpacity
                style={[
                  styles.desktopNavTab,
                  hubTab === 'resumen' && { backgroundColor: '#F6AC13', borderColor: '#F6AC13', borderWidth: 1 }
                ]}
                onPress={() => setHubTab('resumen')}
                activeOpacity={0.7}
              >
                <Text style={[styles.desktopNavTabText, { color: hubTab === 'resumen' ? '#1C2533' : theme.muted, fontWeight: hubTab === 'resumen' ? '900' : '600' }]}>
                  💳 Resumen
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.desktopNavTab,
                  hubTab === 'pro' && { backgroundColor: '#F6AC13', borderColor: '#F6AC13', borderWidth: 1 }
                ]}
                onPress={() => setHubTab('pro')}
                activeOpacity={0.7}
              >
                <Text style={[styles.desktopNavTabText, { color: hubTab === 'pro' ? '#1C2533' : theme.muted, fontWeight: hubTab === 'pro' ? '900' : '600' }]}>
                  ⚡ Opciones PRO
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.desktopNavTab,
                  hubTab === 'cuenta' && { backgroundColor: '#F6AC13', borderColor: '#F6AC13', borderWidth: 1 }
                ]}
                onPress={() => setHubTab('cuenta')}
                activeOpacity={0.7}
              >
                <Text style={[styles.desktopNavTabText, { color: hubTab === 'cuenta' ? '#1C2533' : theme.muted, fontWeight: hubTab === 'cuenta' ? '900' : '600' }]}>
                  👤 Mi Cuenta
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Iconos esenciales: Perfil, Tour Guiado, Privacidad y Tema */}
          <View style={styles.topbarIconsRow}>
            {/* Pill Cuenta de Usuario (Desktop o Tablet) */}
            {isDesktop && (
              <TouchableOpacity
                style={[styles.brandPill, { backgroundColor: hubTab === 'cuenta' ? '#FFFBEB' : theme.card, borderColor: hubTab === 'cuenta' ? '#F6AC13' : theme.border }]}
                onPress={() => setHubTab('cuenta')}
                activeOpacity={0.8}
              >
                <View style={[styles.statusDot, { backgroundColor: (userProfile && !userProfile.id.startsWith('user_')) ? theme.green : '#F6AC13' }]} />
                <Text style={[styles.brandTitle, { color: theme.text }]} numberOfLines={1}>
                  {userProfile?.avatarEmoji ? `${userProfile.avatarEmoji} ` : '👤 '}
                  {userProfile?.nombre ? String(userProfile.nombre).split(' ')[0] : 'Cuenta'}
                </Text>
              </TouchableOpacity>
            )}

            {/* HUEVO DE PASCUA MENSUAL */}
            <TouchableOpacity
              style={[styles.seasonalPill, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => {
                const egg = getSeasonalEasterEgg(monthIndex);
                openConfirm(
                  `${egg.emoji} ${egg.title}`,
                  `${egg.desc}\n\nVersión: Finanzas Contame Pues v1.0.0 🇨🇴 | contamepues.com`,
                  () => {}
                );
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Huevo de pascua temático"
            >
              <Text style={{ fontSize: 16 }}>{getSeasonalEasterEgg(monthIndex).emoji}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => {
                setTutorialStep(0);
                setShowTutorialModal(true);
              }}
              accessibilityLabel="Guía y Tour"
            >
              <Text style={styles.iconButtonText}>✨</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: isAnySectionHidden ? '#FEF3C7' : theme.card, borderColor: isAnySectionHidden ? '#F6AC13' : theme.border }]}
              onPress={toggleMasterPrivacy}
              accessibilityLabel="Modo Privacidad General"
            >
              <Text style={styles.iconButtonText}>{isAnySectionHidden ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={toggleThemeMode}
              accessibilityLabel="Cambiar Tema"
            >
              <Text style={styles.iconButtonText}>{theme.isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* NAVEGADOR DE MES (MES EN CURSO) */}
        <View style={[styles.monthNavigatorCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavArrow} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={[styles.monthNavArrowText, { color: theme.muted }]}>‹</Text>
          </TouchableOpacity>

          <View style={styles.monthTitleWrapper}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <TouchableOpacity onPress={() => setShowMonthPicker(true)}>
                <Text style={[styles.monthActiveText, { color: theme.text }]} numberOfLines={1}>
                  {currentMonth.nombre}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleOpenRenameMonth(currentMonth.id, currentMonth.nombre)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ padding: 2 }}
                accessibilityLabel="Renombrar mes"
              >
                <Text style={{ fontSize: 13, color: theme.muted }}>✏️</Text>
              </TouchableOpacity>
            </View>
            {!isDesktop && (
              <TouchableOpacity onPress={() => setShowCalendar(prev => !prev)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Text style={{ fontSize: 11, color: theme.green, fontWeight: '700' }}>
                  📅 {showCalendar ? 'Ocultar Calendario ▲' : 'Ver Calendario por Días ▼'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavArrow} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={[styles.monthNavArrowText, { color: theme.muted }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnNewMonthHeader, { backgroundColor: theme.cardSubtle, borderColor: theme.border }]}
            onPress={() => setShowMonthModal(true)}
          >
            <Text style={[styles.btnNewMonthHeaderText, { color: theme.text }]}>＋ Nuevo</Text>
          </TouchableOpacity>
        </View>

        {/* CALENDARIO INTERACTIVO DEL MES (DESPLEGABLE SOLO EN MÓVIL) */}
        {showCalendar && !isDesktop && renderCalendarCard(false)}
      </View>

      {/* CONTENIDO PRINCIPAL */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* PESTAÑA 1 DEL HUB: RESUMEN DEL MES */}
        {hubTab === 'resumen' && (
          <View style={isDesktop ? styles.desktopBentoContainer : undefined}>
            <View style={isDesktop ? styles.desktopMainColumn : undefined}>
              {/* HERO CARD: OBSIDIAN FLUID & SHADERGRADIENT */}
            <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }, theme.shadow]}>
              <FluidShaderBackground isDark={theme.isDark} />

              <View style={{ width: '100%', position: 'relative', zIndex: 10 }}>
                {/* Header de la tarjeta: Badge de Estado + Botón Privacidad */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 12 }}>
                  <View style={[styles.heroStatusBadge, { backgroundColor: dineroDisponibleReal >= 0 ? theme.greenSoft : theme.redSoft, borderWidth: 1, borderColor: dineroDisponibleReal >= 0 ? theme.green : theme.red }]}>
                    <Text style={[styles.heroStatusBadgeText, { color: dineroDisponibleReal >= 0 ? theme.green : theme.red, fontWeight: '800' }]}>
                      ⚡ {dineroDisponibleReal >= 0 ? 'SALDO EN MANO HOY' : 'DÉFICIT EN MANO HOY'}
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    onPress={() => toggleSectionPrivacy('disponible')}
                    style={[styles.heroPrivacyBtn, { backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.85)', borderColor: theme.border }]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.text }}>
                      {privacySections.disponible ? '🙈 Oculto' : '👁️ Ver'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Saldo Principal: Disponible Hoy (en grande, claro y sin saldo negativo falso) */}
                <Text style={[styles.heroAmount, { color: dineroDisponibleReal >= 0 ? theme.text : theme.red }]}>
                  {formatDisponible(dineroDisponibleReal)}
                </Text>

                {/* Pill elegante: Dinero Libre Real después de pagar todos los compromisos del mes */}
                <View style={[styles.heroFreeMoneyPill, { backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.55)' : 'rgba(255, 255, 255, 0.85)', borderColor: theme.border }]}>
                  <Text style={{ fontSize: 12, color: theme.text, fontWeight: '700', textAlign: 'center' }}>
                    ✨ Dinero libre tras pagar pendientes:{' '}
                    <Text style={{ color: dineroLibreTotal >= 0 ? theme.green : theme.red, fontWeight: '900' }}>
                      {formatDisponible(dineroLibreTotal)}
                    </Text>
                  </Text>
                  <Text style={{ fontSize: 10, color: theme.muted, marginTop: 3, textAlign: 'center' }}>
                    {egresosPendientes > 0 ? `Restan ${formatCompromisos(egresosPendientes)} por pagar este mes` : '¡Todos tus compromisos están pagados! 🎉'}
                  </Text>
                </View>

                {/* Micro-Métricas en Grid Glass */}
                <View style={styles.heroMicroGrid}>
                  <View style={[styles.heroMicroCard, { backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.40)' : 'rgba(255, 255, 255, 0.75)', borderColor: theme.border }]}>
                    <Text style={[styles.heroMicroLabel, { color: theme.muted }]}>PENDIENTES DEL MES</Text>
                    <Text style={[styles.heroMicroValue, { color: theme.amber }]}>
                      {formatCompromisos(egresosPendientes)}
                    </Text>
                  </View>
                  
                  <View style={[styles.heroMicroCard, { backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.40)' : 'rgba(255, 255, 255, 0.75)', borderColor: theme.border }]}>
                    <Text style={[styles.heroMicroLabel, { color: theme.muted }]}>GASTO DIARIO SEGURO</Text>
                    <Text style={[styles.heroMicroValue, { color: theme.green }]}>
                      {formatCOP(Math.max(0, Math.round(dineroLibreTotal / Math.max(1, (daysInMonth - (new Date().getDate())) + 1))))} / día
                    </Text>
                  </View>
                </View>

                {/* Acceso directo a Proyección Pro */}
                <TouchableOpacity
                  style={[styles.heroProToggle, { backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.06)', borderColor: theme.greenSoft, borderWidth: 1 }]}
                  onPress={() => setHubTab('pro')}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 11, color: theme.green, fontWeight: '800' }}>
                    📈 Ver Proyección y Análisis Pro a Fin de Mes ➜
                  </Text>
                </TouchableOpacity>
              </View>

              {/* STATS: INGRESOS Y COMPROMISOS */}
              <View style={[styles.statCardsRow, { zIndex: 10, marginTop: 14 }]}>
                {/* Ingresos (Independiente) */}
                <TouchableOpacity
                  style={[styles.statBox, { backgroundColor: theme.bg, borderColor: theme.border }]}
                  onPress={openSetupModal}
                  activeOpacity={0.7}
                >
                  <View style={styles.statBoxHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: theme.green }}>● Ingresos</Text>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation?.();
                          toggleSectionPrivacy('ingresos');
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={{ fontSize: 12 }}>{privacySections.ingresos ? '🙈' : '👁️'}</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={{ fontSize: 11, color: theme.muted }}>Editar ✏️</Text>
                  </View>
                  <Text style={[styles.statBoxAmount, { color: theme.text }]}>{formatIngresos(ingresosTotal)}</Text>
                  <Text style={[styles.statBoxSub, { color: theme.muted }]}>
                    Recibido: <Text style={{ color: theme.green, fontWeight: '700' }}>{formatIngresos(ingresosRecibidosTotal)}</Text>
                    {ingresosPendientes > 0 ? ` • ${formatIngresos(ingresosPendientes)} pendientes` : ''}
                  </Text>
                </TouchableOpacity>

                {/* Gastos / Compromisos (Independiente) */}
                <View style={[styles.statBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <View style={styles.statBoxHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: theme.red }}>● Compromisos</Text>
                      <TouchableOpacity
                        onPress={() => toggleSectionPrivacy('compromisos')}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={{ fontSize: 12 }}>{privacySections.compromisos ? '🙈' : '👁️'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={[styles.statBoxAmount, { color: theme.text }]}>{formatCompromisos(egresosTotal)}</Text>
                  <Text style={[styles.statBoxSub, { color: theme.muted }]}>
                    Pagado: <Text style={{ color: theme.green, fontWeight: '700' }}>{formatCompromisos(egresosPagados)}</Text>
                    {egresosPendientes > 0 ? ` • ${formatCompromisos(egresosPendientes)} por pagar` : ''}
                  </Text>
                </View>
              </View>

              {/* BARRA DE PROGRESO DE PAGOS */}
              <View style={[styles.progressBarContainer, { backgroundColor: theme.bg, borderColor: theme.border, zIndex: 10 }]}>
                <View style={styles.progressInfoRow}>
                  <Text style={[styles.progressTitle, { color: theme.text }]}>Progreso de pagos ejecutados</Text>
                  <Text style={[styles.progressValues, { color: theme.green }]}>
                    {formatCompromisos(egresosPagados)} de {formatCompromisos(egresosTotal)} ({pctPagado}%)
                  </Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: theme.cardSubtle }]}>
                  <View style={[styles.progressFill, { width: `${pctPagado}%`, backgroundColor: theme.green }]} />
                </View>
                <Text style={{ fontSize: 10, color: theme.muted, marginTop: 4, textAlign: 'right' }}>
                  {egresosPendientes > 0 ? `Restan ${formatCompromisos(egresosPendientes)} por liquidar este mes` : '¡Todos los compromisos pagados! 🎉'}
                </Text>
              </View>
            </View>

            {/* ACCIONES RÁPIDAS CONTAME PUES */}
            <View style={styles.quickActionsContainer}>
              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: theme.isDark ? theme.brandSoft : '#FEF3C7', borderColor: '#F6AC13' }]}
                onPress={() => {
                  setNewTipo('Ingreso');
                  setNewCat('Ingreso Sueldo');
                  setNewDesc('');
                  setNewMonto('');
                  setShowAddModal(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 18 }}>💰</Text>
                <Text style={[styles.quickActionLabel, { color: theme.isDark ? '#F6AC13' : '#92400E', fontWeight: '800' }]}>＋ Ingreso</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: theme.isDark ? theme.redSoft : '#FEE2E2', borderColor: '#ED3432' }]}
                onPress={() => {
                  setNewTipo('Egreso');
                  setNewCat('Supermercado');
                  setNewDesc('');
                  setNewMonto('');
                  setShowAddModal(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 18 }}>💸</Text>
                <Text style={[styles.quickActionLabel, { color: theme.isDark ? '#ED3432' : '#991B1B', fontWeight: '800' }]}>－ Gasto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => {
                  setNumpadAmount('0');
                  setNumpadDesc('');
                  setNumpadCat('Supermercado');
                  setShowNumpadModal(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 18 }}>⚡</Text>
                <Text style={[styles.quickActionLabel, { color: theme.text }]}>1-Clic</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => setHubTab('cuenta')}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 18 }}>📸</Text>
                <Text style={[styles.quickActionLabel, { color: theme.text }]}>Escáner</Text>
              </TouchableOpacity>
            </View>

            {/* EN MÓVIL/TABLET: SECCIONES LATERALES AQUÍ; EN DESKTOP PASAN A LA COLUMNA DERECHA */}
            {!isDesktop && renderRightSidebarContent()}

            {/* SECCIÓN 3: MOVIMIENTOS DEL MES (RESPONSIVE & NUNCA CORTADO) */}
            <View style={styles.txSectionHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.sectionTitle, { color: theme.text }]} numberOfLines={1}>
                  Movimientos del Mes
                </Text>
                <Text style={{ fontSize: 12, color: theme.muted, fontWeight: '600', marginTop: 2 }} numberOfLines={1}>
                  Toca cualquier gasto para editar su valor
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.btnAddTxSmall, { backgroundColor: theme.green }]}
                onPress={() => setShowAddModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.btnAddTxSmallText}>＋ Agregar</Text>
              </TouchableOpacity>
            </View>

            {/* FILTROS POR RANGO DE FECHAS (TODO EL MES, 7 DÍAS, 15 DÍAS, 30 DÍAS, 60 DÍAS) */}
            <View style={{ marginBottom: 10 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rangeFilterRow}>
                <TouchableOpacity
                  style={[styles.rangeChip, { backgroundColor: dateRangeFilter === 'ALL' ? theme.accent : theme.card, borderColor: theme.border }]}
                  onPress={() => setDateRangeFilter('ALL')}
                >
                  <Text style={[styles.rangeChipText, { color: dateRangeFilter === 'ALL' ? theme.accentText : theme.muted }]}>
                    🗓️ Todo el mes
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.rangeChip, { backgroundColor: dateRangeFilter === '7D' ? theme.accent : theme.card, borderColor: theme.border }]}
                  onPress={() => setDateRangeFilter('7D')}
                >
                  <Text style={[styles.rangeChipText, { color: dateRangeFilter === '7D' ? theme.accentText : theme.muted }]}>
                    ⚡ Últimos 7 días
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.rangeChip, { backgroundColor: dateRangeFilter === '15D' ? theme.accent : theme.card, borderColor: theme.border }]}
                  onPress={() => setDateRangeFilter('15D')}
                >
                  <Text style={[styles.rangeChipText, { color: dateRangeFilter === '15D' ? theme.accentText : theme.muted }]}>
                    15 días
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.rangeChip, { backgroundColor: dateRangeFilter === '30D' ? theme.accent : theme.card, borderColor: theme.border }]}
                  onPress={() => setDateRangeFilter('30D')}
                >
                  <Text style={[styles.rangeChipText, { color: dateRangeFilter === '30D' ? theme.accentText : theme.muted }]}>
                    30 días
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.rangeChip, { backgroundColor: dateRangeFilter === '60D' ? theme.accent : theme.card, borderColor: theme.border }]}
                  onPress={() => setDateRangeFilter('60D')}
                >
                  <Text style={[styles.rangeChipText, { color: dateRangeFilter === '60D' ? theme.accentText : theme.muted }]}>
                    60 días
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* BANNER CUANDO HAY UN DÍA SELECCIONADO EN EL CALENDARIO */}
            {selectedDay !== null && (
              <View style={[styles.dayActiveBanner, { backgroundColor: theme.greenSoft, borderColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: theme.green, fontWeight: '800' }}>
                    📅 Filtrando: Día {selectedDay} de {MESES_ES[monthIndex]}
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.text, marginTop: 1 }}>
                    {filteredMovimientos.length} movimiento(s) registrado(s) este día
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedDay(null)}
                  style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: theme.card }}
                >
                  <Text style={{ fontSize: 11, color: theme.green, fontWeight: '800' }}>Ver todo ✕</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* BUSCADOR */}
            <TextInput
              style={[styles.searchInput, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder="🔍 Buscar por nombre o comercio..."
              placeholderTextColor={theme.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {/* FILTROS POR ESTADO */}
            <View style={styles.filterStatusRow}>
              <TouchableOpacity
                style={[styles.filterStatusBtn, filterStatus === 'ALL' && { backgroundColor: theme.accent }]}
                onPress={() => setFilterStatus('ALL')}
              >
                <Text style={[styles.filterStatusText, { color: filterStatus === 'ALL' ? theme.accentText : theme.muted }]}>
                  Todos ({currentMonth.movimientos.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterStatusBtn, filterStatus === 'PENDING' && { backgroundColor: theme.accent }]}
                onPress={() => setFilterStatus('PENDING')}
              >
                <Text style={[styles.filterStatusText, { color: filterStatus === 'PENDING' ? theme.accentText : theme.muted }]}>
                  ⏳ Pendientes ({egresosList.filter(t => !t.pagado).length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterStatusBtn, filterStatus === 'PAID' && { backgroundColor: theme.accent }]}
                onPress={() => setFilterStatus('PAID')}
              >
                <Text style={[styles.filterStatusText, { color: filterStatus === 'PAID' ? theme.accentText : theme.muted }]}>
                  ✓ Pagados ({egresosList.filter(t => t.pagado).length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* FILTROS POR CATEGORÍA EN SCROLL HORIZONTAL */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              <TouchableOpacity
                style={[styles.chip, { backgroundColor: selectedCategoryChip === 'ALL' ? theme.accent : theme.card, borderColor: theme.border }]}
                onPress={() => setSelectedCategoryChip('ALL')}
              >
                <Text style={[styles.chipText, { color: selectedCategoryChip === 'ALL' ? theme.accentText : theme.muted }]}>
                  ✨ Todas las categorías
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.chip, { backgroundColor: selectedCategoryChip === 'ONLY_INGRESOS' ? theme.accent : theme.card, borderColor: theme.border }]}
                onPress={() => setSelectedCategoryChip('ONLY_INGRESOS')}
              >
                <Text style={[styles.chipText, { color: selectedCategoryChip === 'ONLY_INGRESOS' ? theme.accentText : theme.muted }]}>
                  💰 Ingresos
                </Text>
              </TouchableOpacity>

              {uniqueCategories.map((c, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.chip, { backgroundColor: selectedCategoryChip === c ? theme.accent : theme.card, borderColor: theme.border }]}
                  onPress={() => setSelectedCategoryChip(c)}
                >
                  <Text style={[styles.chipText, { color: selectedCategoryChip === c ? theme.accentText : theme.muted }]}>
                    {getCategoryEmoji(c, 'Egreso')} {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* LISTA DE MOVIMIENTOS INTERACTIVA (PENDIENTES ACTIVOS) */}
            <View style={styles.txList}>
              {movimientosPendientes.map((item) => {
                const isIngreso = String(item.tipo || '').toLowerCase() === 'ingreso';
                const emoji = getCategoryEmoji(item.categoria, item.tipo);
                const dayNumber = getTxDay(item, monthYear, monthIndex);

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.txItem,
                      { backgroundColor: theme.card, borderColor: theme.border },
                      theme.shadow
                    ]}
                    onPress={() => openEditTxModal(item)}
                    activeOpacity={0.7}
                  >
                    {/* Checkbox para alternar pagado/pendiente (al marcarlo se va a Pagadas) */}
                    <TouchableOpacity
                      style={[
                        styles.checkbox,
                        { borderColor: theme.muted }
                      ]}
                      onPress={() => togglePaid(item.id)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      {Boolean(item.pagado) ? <Text style={styles.checkMark}>✓</Text> : null}
                    </TouchableOpacity>

                    {/* Emoji */}
                    <View style={styles.txEmojiBox}>
                      <Text style={{ fontSize: 20 }}>{emoji}</Text>
                    </View>

                    {/* Descripción y Categoría */}
                    <View style={styles.txInfo}>
                      <Text style={[styles.txTitle, { color: theme.text }]} numberOfLines={1}>
                        {item.descripcion}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <Text style={[styles.txSub, { color: theme.muted }]}>{item.categoria}</Text>
                        {dayNumber && (
                          <Text style={{ fontSize: 10, color: theme.muted, backgroundColor: theme.bg, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                            Día {dayNumber}
                          </Text>
                        )}
                        <Text style={{ fontSize: 10, color: isIngreso ? theme.green : theme.amber, fontWeight: '700' }}>
                          ● {isIngreso ? 'Ingreso' : 'Pendiente'}
                        </Text>
                      </View>
                    </View>

                    {/* Monto y Flechita para editar */}
                    <View style={styles.txRight}>
                      <Text style={[styles.txAmount, { color: isIngreso ? theme.green : theme.text }]}>
                        {isIngreso ? '+' : ''}{isIngreso ? formatIngresos(item.monto) : formatCompromisos(item.monto)}
                      </Text>
                      <Text style={{ fontSize: 11, color: theme.muted }}>Editar ✏️</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* CELEBRACIÓN SI NO QUEDAN MOVIMIENTOS PENDIENTES */}
              {(currentMonth?.movimientos?.length || 0) > 0 && movimientosPendientes.length === 0 && (
                <View style={[styles.emptyStarterCard, { backgroundColor: theme.card, borderColor: theme.border }, theme.shadow]}>
                  <Text style={{ fontSize: 38, marginBottom: 8 }}>🎉</Text>
                  <Text style={[styles.emptyStarterTitle, { color: theme.green }]}>¡Estás al día este mes!</Text>
                  <Text style={[styles.emptyStarterSub, { color: theme.muted }]}>
                    No tienes ningún compromiso pendiente ni ingresos por cobrar. Todo ha sido liquidado y archivado limpiamente.
                  </Text>
                </View>
              )}

              {/* SECCIÓN INGRESOS RECIBIDOS (CERO RUIDO VISUAL) */}
              {ingresosRecibidos.length > 0 && (
                <View style={[styles.pagadasContainerCard, { backgroundColor: theme.card, borderColor: theme.border }, theme.shadow]}>
                  <TouchableOpacity
                    style={styles.pagadasHeaderRow}
                    onPress={() => setIsIngresosExpanded(prev => !prev)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View style={[styles.pagadasCountBadge, { backgroundColor: theme.greenSoft }]}>
                        <Text style={{ fontSize: 13, color: theme.green, fontWeight: '900' }}>💰 {ingresosRecibidos.length}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pagadasSectionTitle, { color: theme.text }]}>
                          Ingresos Recibidos
                        </Text>
                        <Text style={{ fontSize: 11, color: theme.muted, marginTop: 1 }}>
                          +{formatCOP(totalMontoIngresosRecibidos)} cobrados este mes
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 12, color: theme.green, fontWeight: '800' }}>
                      {isIngresosExpanded ? 'Ocultar ▲' : 'Ver Recibidos ▼'}
                    </Text>
                  </TouchableOpacity>

                  {isIngresosExpanded && (
                    <View style={styles.pagadasExpandedList}>
                      <Text style={{ fontSize: 11, color: theme.muted, marginBottom: 8, marginTop: 4 }}>
                        Toca el check para desmarcar o toca el ingreso para editar su valor:
                      </Text>
                      {ingresosRecibidos.map((item) => {
                        const emoji = getCategoryEmoji(item.categoria, item.tipo);
                        const dayNumber = getTxDay(item, monthYear, monthIndex);
                        return (
                          <TouchableOpacity
                            key={item.id}
                            style={[styles.pagadaItemRow, { backgroundColor: theme.bg, borderColor: theme.border }]}
                            onPress={() => openEditTxModal(item)}
                            activeOpacity={0.7}
                          >
                            <TouchableOpacity
                              style={[styles.checkbox, { backgroundColor: theme.green, borderColor: theme.green }]}
                              onPress={() => togglePaid(item.id)}
                              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            >
                              <Text style={styles.checkMark}>✓</Text>
                            </TouchableOpacity>

                            <View style={styles.txEmojiBox}>
                              <Text style={{ fontSize: 18 }}>{emoji}</Text>
                            </View>

                            <View style={styles.txInfo}>
                              <Text style={[styles.txTitle, { color: theme.text, fontWeight: '800' }]} numberOfLines={1}>
                                {item.descripcion}
                              </Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                <Text style={[styles.txSub, { color: theme.muted }]}>{item.categoria}</Text>
                                {dayNumber && (
                                  <Text style={{ fontSize: 10, color: theme.muted }}>· Día {dayNumber}</Text>
                                )}
                                <Text style={{ fontSize: 10, color: theme.green, fontWeight: '700' }}>● Recibido</Text>
                              </View>
                            </View>

                            <View style={styles.txRight}>
                              <Text style={[styles.txAmount, { color: theme.green, fontWeight: '900' }]}>
                                +{formatIngresos(item.monto)}
                              </Text>
                              <Text style={{ fontSize: 10, color: theme.muted }}>Editar ✏️</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}

              {/* SECCIÓN PAGADAS Y FACTURAS DEL MES (CERO RUIDO VISUAL) */}
              {movimientosPagados.length > 0 && (
                <View style={[styles.pagadasContainerCard, { backgroundColor: theme.card, borderColor: theme.border }, theme.shadow]}>
                  <TouchableOpacity
                    style={styles.pagadasHeaderRow}
                    onPress={() => setIsPagadasExpanded(prev => !prev)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View style={[styles.pagadasCountBadge, { backgroundColor: theme.greenSoft }]}>
                        <Text style={{ fontSize: 13, color: theme.green, fontWeight: '900' }}>✓ {movimientosPagados.length}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pagadasSectionTitle, { color: theme.text }]}>
                          Facturas y Gastos Pagados
                        </Text>
                        <Text style={{ fontSize: 11, color: theme.muted, marginTop: 1 }}>
                          {formatCOP(totalMontoPagados)} liquidados este mes
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 12, color: theme.green, fontWeight: '800' }}>
                      {isPagadasExpanded ? 'Ocultar ▲' : 'Ver Pagadas ▼'}
                    </Text>
                  </TouchableOpacity>

                  {isPagadasExpanded && (
                    <View style={styles.pagadasExpandedList}>
                      <Text style={{ fontSize: 11, color: theme.muted, marginBottom: 8, marginTop: 4 }}>
                        Toca el check para desmarcar o toca el gasto para editar su valor:
                      </Text>
                      {movimientosPagados.map((item) => {
                        const emoji = getCategoryEmoji(item.categoria, item.tipo);
                        const dayNumber = getTxDay(item, monthYear, monthIndex);
                        return (
                          <TouchableOpacity
                            key={item.id}
                            style={[styles.pagadaItemRow, { backgroundColor: theme.bg, borderColor: theme.border }]}
                            onPress={() => openEditTxModal(item)}
                            activeOpacity={0.7}
                          >
                            <TouchableOpacity
                              style={[styles.checkbox, { backgroundColor: theme.green, borderColor: theme.green }]}
                              onPress={() => togglePaid(item.id)}
                              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            >
                              <Text style={styles.checkMark}>✓</Text>
                            </TouchableOpacity>

                            <View style={styles.txEmojiBox}>
                              <Text style={{ fontSize: 18 }}>{emoji}</Text>
                            </View>

                            <View style={styles.txInfo}>
                              <Text style={[styles.txTitle, { color: theme.muted, textDecorationLine: 'line-through' }]} numberOfLines={1}>
                                {item.descripcion}
                              </Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                <Text style={[styles.txSub, { color: theme.muted }]}>{item.categoria}</Text>
                                {dayNumber && (
                                  <Text style={{ fontSize: 10, color: theme.muted }}>· Día {dayNumber}</Text>
                                )}
                                <Text style={{ fontSize: 10, color: theme.green, fontWeight: '700' }}>● Pagado</Text>
                              </View>
                            </View>

                            <View style={styles.txRight}>
                              <Text style={[styles.txAmount, { color: theme.text, opacity: 0.85 }]}>
                                {formatCompromisos(item.monto)}
                              </Text>
                              <Text style={{ fontSize: 10, color: theme.muted }}>Editar ✏️</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}

              {currentMonth.movimientos.length === 0 ? (
                <View style={[styles.emptyStarterCard, { backgroundColor: theme.card, borderColor: theme.border }, theme.shadow]}>
                  <Text style={{ fontSize: 44, marginBottom: 10 }}>🌱</Text>
                  <Text style={[styles.emptyStarterTitle, { color: theme.text }]}>¡Tu mes comienza en $0!</Text>
                  <Text style={[styles.emptyStarterSub, { color: theme.muted }]}>
                    Fija tu sueldo o ingreso mensual y añade tus compromisos para calcular tu balance y dinero libre en tiempo real.
                  </Text>
                  <View style={styles.emptyStarterActionsRow}>
                    <TouchableOpacity
                      style={[styles.btnSetupStarter, { backgroundColor: theme.green }]}
                      onPress={openSetupModal}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>⚙️ Fijar Sueldo Base</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btnAddStarter, { backgroundColor: theme.accent }]}
                      onPress={() => setShowAddModal(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: theme.accentText, fontWeight: '800', fontSize: 13 }}>＋ Añadir Gasto</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (filteredMovimientos.length === 0) ? (
                <View style={[styles.emptyStateCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>🔍</Text>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: theme.text }}>No hay movimientos</Text>
                  <Text style={{ fontSize: 13, color: theme.muted, textAlign: 'center', marginTop: 4 }}>
                    No se encontraron registros con los filtros seleccionados.
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* COLUMNA LATERAL PERMANENTE (SOLO EN DESKTOP SAAS BENTO GRID) */}
          {isDesktop && (
            <View style={styles.desktopSideColumn}>
              {renderCalendarCard(true)}
              {renderRightSidebarContent()}
            </View>
          )}
        </View>
      )}

      {/* PESTAÑA 2 DEL HUB: OPCIONES PRO & INTELIGENCIA */}
      {hubTab === 'pro' && (
        <View style={isDesktop ? styles.desktopTabWrapper : undefined}>
            {/* Header PRO */}
            <View style={[styles.hubHeaderBanner, { backgroundColor: theme.card, borderColor: theme.border }, theme.shadow]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.bigAvatar, { backgroundColor: theme.greenSoft }]}>
                  <Text style={{ fontSize: 26 }}>⚡</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.hubHeaderTitle, { color: theme.text }]}>Opciones PRO & Inteligencia</Text>
                  <Text style={[styles.hubHeaderSub, { color: theme.muted }]}>
                    Proyecta cierres, automatiza suscripciones, amortiza deudas y escanea comprobantes
                  </Text>
                </View>
              </View>
            </View>

            {/* CARD 1: PROYECCIÓN A FIN DE MES (BURN-RATE PREDICTOR) */}
            <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }, theme.shadow]}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.sectionHeading, { color: theme.text }]}>🔮 Proyección a Fin de Mes</Text>
                  </View>
                  <Text style={[styles.sectionSubHeading, { color: theme.muted }]}>
                    {burnRateProjection.cicloDesc} • Quedan {burnRateProjection.diasRestantes} días
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <View style={[styles.badgeFree, { backgroundColor: burnRateProjection.esPositivo ? theme.greenSoft : theme.redSoft }]}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: burnRateProjection.esPositivo ? theme.green : theme.red }}>
                      {burnRateProjection.esPositivo ? '🟢 Ahorro Proyectado' : '🔴 Déficit Previsto'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.btnModifyCycle, { backgroundColor: theme.cardSubtle, borderColor: theme.border }]}
                    onPress={openSetupModal}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '800', color: theme.green }}>⚙️ Ajustar Ciclo</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.burnRateRow, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <View style={styles.burnRateCol}>
                  <Text style={{ fontSize: 11, color: theme.muted }}>Ritmo Actual</Text>
                  <Text style={[styles.burnRateAmount, { color: theme.text }]}>
                    {formatCOP(burnRateProjection.gastoPromedioDiario)}<Text style={{ fontSize: 10, color: theme.muted }}>/día</Text>
                  </Text>
                </View>
                <View style={{ width: 1, height: 32, backgroundColor: theme.border }} />
                <View style={styles.burnRateCol}>
                  <Text style={{ fontSize: 11, color: theme.muted }}>Límite Diario Seguro</Text>
                  <Text style={[styles.burnRateAmount, { color: theme.green }]}>
                    {formatCOP(burnRateProjection.gastoDiarioSeguro)}<Text style={{ fontSize: 10, color: theme.muted }}>/día</Text>
                  </Text>
                </View>
                <View style={{ width: 1, height: 32, backgroundColor: theme.border }} />
                <View style={styles.burnRateCol}>
                  <Text style={{ fontSize: 11, color: theme.muted }}>Cierre Estimado</Text>
                  <Text style={[styles.burnRateAmount, { color: burnRateProjection.esPositivo ? theme.green : theme.red }]}>
                    {burnRateProjection.esPositivo ? '+' : ''}{formatCOP(burnRateProjection.balanceProyectado)}
                  </Text>
                </View>
              </View>

              <Text style={{ fontSize: 12, color: theme.muted, marginTop: 10, lineHeight: 17, textAlign: 'center' }}>
                {burnRateProjection.esPositivo
                  ? `✨ Excelente control: Al ritmo actual cerrarás el mes con ${formatCOP(burnRateProjection.balanceProyectado)} libres.`
                  : `⚠️ Atención: A este ritmo de gasto (${formatCOP(burnRateProjection.gastoPromedioDiario)}/día), tu disponible se agotará antes de fin de mes. Reduce a máximo ${formatCOP(burnRateProjection.gastoDiarioSeguro)}/día para equilibrar.`}
              </Text>
            </View>

            {/* CARD 2: GESTOR DE SUSCRIPCIONES RECURRENTES */}
            <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }, theme.shadow]}>
              <TouchableOpacity
                style={styles.sectionHeaderRow}
                onPress={() => setIsSubsExpanded(prev => !prev)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.sectionHeading, { color: theme.text }]}>🔄 Suscripciones Recurrentes ({suscripciones.filter(s => s.activo).length})</Text>
                    <Text style={{ fontSize: 13, color: theme.green, fontWeight: '800' }}>
                      {isSubsExpanded ? '▲' : '▼'}
                    </Text>
                  </View>
                  <Text style={[styles.sectionSubHeading, { color: theme.muted }]}>
                    {isSubsExpanded ? 'Servicios fijos que impactan tu presupuesto' : 'Toca para ver Netflix, Gym, seguros, etc.'}
                  </Text>
                </View>
                <View style={[styles.totalGoalsBadge, { backgroundColor: theme.greenSoft }]}>
                  <Text style={[styles.totalGoalsText, { color: theme.green }]}>
                    {formatCOP(totalSubsMensual)}/mes
                  </Text>
                </View>
              </TouchableOpacity>

              {isSubsExpanded && (
                <View style={{ gap: 10 }}>
                  <View style={[styles.subsSummaryBanner, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <Text style={{ fontSize: 12, color: theme.text, fontWeight: '700' }}>
                      💡 Impacto anual: <Text style={{ color: theme.red, fontWeight: '900' }}>{formatCOP(totalSubsAnual)}</Text> al año en suscripciones
                    </Text>
                    <TouchableOpacity
                      style={[styles.btnImportSubs, { backgroundColor: theme.accent }]}
                      onPress={handleImportSubsToMonth}
                    >
                      <Text style={{ color: theme.accentText, fontSize: 11, fontWeight: '800' }}>⚡ Cargar a este mes</Text>
                    </TouchableOpacity>
                  </View>

                  {suscripciones.map(sub => (
                    <View key={sub.id} style={[styles.subCardItem, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <Text style={{ fontSize: 24 }}>{sub.emoji || '🎬'}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.goalName, { color: theme.text }]} numberOfLines={1}>{sub.nombre}</Text>
                          <Text style={{ fontSize: 11, color: theme.muted }}>Cobra el día {sub.diaCobro} de cada mes</Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Text style={[styles.goalAmount, { color: theme.text }]}>{formatCOP(sub.monto)}</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity onPress={() => handleToggleSuscripcion(sub.id)}>
                            <Text style={{ fontSize: 11, color: sub.activo ? theme.green : theme.muted, fontWeight: '700' }}>
                              {sub.activo ? '● Activa' : '○ Pausada'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteSuscripcion(sub.id)}>
                            <Text style={{ fontSize: 11, color: theme.red }}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={[styles.btnAddGoal, { backgroundColor: theme.cardSubtle, borderColor: theme.border }]}
                    onPress={() => setShowSubModal(true)}
                  >
                    <Text style={[styles.btnAddGoalText, { color: theme.green }]}>＋ Añadir Nueva Suscripción</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* CARD 3: INTELIGENCIA Y MANEJO DE DEUDAS (BOLA DE NIEVE & AVALANCHA) */}
            <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }, theme.shadow]}>
              <TouchableOpacity
                style={styles.sectionHeaderRow}
                onPress={() => setIsDeudasExpanded(prev => !prev)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.sectionHeading, { color: theme.text }]}>💳 Inteligencia de Deudas ({deudas.length})</Text>
                    <Text style={{ fontSize: 13, color: theme.green, fontWeight: '800' }}>
                      {isDeudasExpanded ? '▲' : '▼'}
                    </Text>
                  </View>
                  <Text style={[styles.sectionSubHeading, { color: theme.muted }]}>
                    {isDeudasExpanded ? 'Simulador de amortización y ahorro de intereses' : 'Toca para simular cómo liquidar tus deudas más rápido'}
                  </Text>
                </View>
                <View style={[styles.totalGoalsBadge, { backgroundColor: theme.redSoft }]}>
                  <Text style={[styles.totalGoalsText, { color: theme.red }]}>
                    {formatCOP(totalSaldoDeudas)}
                  </Text>
                </View>
              </TouchableOpacity>

              {isDeudasExpanded && (
                <View style={{ gap: 12 }}>
                  {/* Selector de Abono Extra Mensual */}
                  <View style={[styles.debtSimCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: theme.text, marginBottom: 6 }}>
                      🚀 Simulador de Abono Adicional a Capital
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.muted, marginBottom: 8 }}>
                      ¿Cuánto extra podrías pagar cada mes sobre la cuota mínima?
                    </Text>

                    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
                      {[50000, 100000, 200000, 500000].map(val => (
                        <TouchableOpacity
                          key={val}
                          style={[
                            styles.rangeChip,
                            { backgroundColor: abonoExtraMensual === val ? theme.green : theme.card, borderColor: theme.border, flex: 1, alignItems: 'center' }
                          ]}
                          onPress={() => setAbonoExtraMensual(val)}
                        >
                          <Text style={{ fontSize: 10, fontWeight: '800', color: abonoExtraMensual === val ? '#FFF' : theme.text }}>
                            +${val / 1000}k
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Resultado del simulador */}
                    <View style={[styles.debtResultPill, { backgroundColor: theme.greenSoft }]}>
                      <Text style={{ fontSize: 12, color: theme.green, fontWeight: '800', lineHeight: 18, textAlign: 'center' }}>
                        🎉 Abonando {formatCOP(abonoExtraMensual)} extra al mes: ¡Te ahorras {debtSimulation.mesesAhorrados} meses de cuotas y aprox. {formatCOP(debtSimulation.interesesAhorrados)} en intereses!
                      </Text>
                      <Text style={{ fontSize: 11, color: theme.muted, textAlign: 'center', marginTop: 4 }}>
                        {dineroDisponibleReal >= abonoExtraMensual
                          ? `💡 Con tu disponible real en cuenta (${formatCOP(dineroDisponibleReal)}), puedes cubrir este abono con tranquilidad.`
                          : `💡 Tu disponible actual es ${formatCOP(dineroDisponibleReal)}. Ajusta gastos no esenciales para liberar este margen extra.`}
                      </Text>
                    </View>

                    {/* Selector de Estrategia Alineado y Espacioso */}
                    <Text style={{ fontSize: 12, fontWeight: '800', color: theme.text, marginTop: 12, marginBottom: 6 }}>
                      Estrategia de Pago Acelerado:
                    </Text>
                    <View style={{ gap: 8 }}>
                      <TouchableOpacity
                        style={[
                          styles.debtStrategyCard,
                          {
                            backgroundColor: estrategiaDeuda === 'snowball' ? theme.cardSubtle : theme.bg,
                            borderColor: estrategiaDeuda === 'snowball' ? theme.green : theme.border
                          }
                        ]}
                        onPress={() => setEstrategiaDeuda('snowball')}
                        activeOpacity={0.8}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 8 }}>
                            <Text style={{ fontSize: 20 }}>❄️</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 13, fontWeight: '800', color: estrategiaDeuda === 'snowball' ? theme.green : theme.text }}>
                                Bola de Nieve (Menor saldo primero)
                              </Text>
                              <Text style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>
                                Victoria psicológica liquidando las deudas más pequeñas
                              </Text>
                            </View>
                          </View>
                          <View style={[styles.strategyRadio, { borderColor: estrategiaDeuda === 'snowball' ? theme.green : theme.border }]}>
                            {estrategiaDeuda === 'snowball' && <View style={[styles.strategyRadioDot, { backgroundColor: theme.green }]} />}
                          </View>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.debtStrategyCard,
                          {
                            backgroundColor: estrategiaDeuda === 'avalanche' ? theme.cardSubtle : theme.bg,
                            borderColor: estrategiaDeuda === 'avalanche' ? theme.green : theme.border
                          }
                        ]}
                        onPress={() => setEstrategiaDeuda('avalanche')}
                        activeOpacity={0.8}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 8 }}>
                            <Text style={{ fontSize: 20 }}>⚡</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 13, fontWeight: '800', color: estrategiaDeuda === 'avalanche' ? theme.green : theme.text }}>
                                Avalancha (Mayor tasa de interés primero)
                              </Text>
                              <Text style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>
                                Óptimo matemáticamente: ahorra la mayor cantidad de intereses
                              </Text>
                            </View>
                          </View>
                          <View style={[styles.strategyRadio, { borderColor: estrategiaDeuda === 'avalanche' ? theme.green : theme.border }]}>
                            {estrategiaDeuda === 'avalanche' && <View style={[styles.strategyRadioDot, { backgroundColor: theme.green }]} />}
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Lista de Deudas ordenadas según estrategia */}
                  {([...(deudas || [])].sort((a, b) => estrategiaDeuda === 'snowball' ? a.saldoTotal - b.saldoTotal : b.tasaInteresAnual - a.tasaInteresAnual)).map((deuda, idx) => {
                    const deudaNameClean = String(deuda.nombre || '').trim().toLowerCase();
                    const relatedTx = (currentMonth?.movimientos || []).find(t => {
                      if (String(t.tipo || '').toLowerCase() === 'ingreso') return false;
                      const txDesc = String(t.descripcion || '').toLowerCase();
                      const txCat = String(t.categoria || '').toLowerCase();
                      return txDesc.includes(deudaNameClean) || deudaNameClean.includes(txDesc) || txCat.includes('deuda') || txCat.includes('crédito') || txCat.includes('credito');
                    });
                    const isCuotaPagada = Boolean(relatedTx?.pagado);

                    return (
                      <View key={deuda.id} style={[styles.subCardItem, { backgroundColor: theme.bg, borderColor: theme.border, marginBottom: 8 }]}>
                        <TouchableOpacity
                          style={{ flex: 1, paddingRight: 8 }}
                          onPress={() => handleOpenEditDeuda(deuda)}
                          activeOpacity={0.7}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={{ fontSize: 11, fontWeight: '900', color: theme.green }}>#{idx + 1}</Text>
                            <Text style={[styles.goalName, { color: theme.text }]} numberOfLines={1}>{deuda.nombre}</Text>
                            <Text style={{ fontSize: 11, color: theme.green, fontWeight: '700' }}>✏️</Text>
                          </View>
                          <Text style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>
                            Plazo: {deuda.plazoMeses || 12} meses • Cuota: {formatCOP(deuda.cuotaMinima)}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                            <Text style={{ fontSize: 10, color: theme.muted }}>
                              Tasa: {deuda.tasaInteresAnual}% E.A. • Corte: día {deuda.diaCorte}
                            </Text>
                            {Boolean(relatedTx) ? (
                              <Text style={{ fontSize: 10, fontWeight: '800', color: isCuotaPagada ? theme.green : theme.amber }}>
                                {isCuotaPagada ? '● Cuota pagada este mes' : '⏳ Cuota pendiente'}
                              </Text>
                            ) : null}
                          </View>
                        </TouchableOpacity>
                        <View style={{ alignItems: 'flex-end', gap: 6 }}>
                          <Text style={[styles.goalAmount, { color: theme.red }]}>{formatCOP(deuda.saldoTotal)}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <TouchableOpacity onPress={() => handleOpenEditDeuda(deuda)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                              <Text style={{ fontSize: 11, color: theme.green, fontWeight: '700' }}>Editar ✏️</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteDeuda(deuda.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                              <Text style={{ fontSize: 11, color: theme.red }}>Eliminar 🗑️</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })}

                  <TouchableOpacity
                    style={[styles.btnAddGoal, { backgroundColor: theme.cardSubtle, borderColor: theme.border }]}
                    onPress={handleOpenCreateDeuda}
                  >
                    <Text style={[styles.btnAddGoalText, { color: theme.green }]}>＋ Registrar Nueva Deuda o Tarjeta</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* CARD 4: ESCÁNER DE NOTIFICACIONES BANCARIAS */}
            <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }, theme.shadow]}>
              <Text style={[styles.sectionHeading, { color: theme.text }]}>📥 Escáner de Notificaciones Bancarias</Text>
              <Text style={[styles.sectionSubHeading, { color: theme.muted }]}>
                Registra compras de Bancolombia, Nu, Davivienda, Nequi y PSE en 1 segundo sin digitar.
              </Text>

              {/* AVISO DE PRIVACIDAD APPLE */}
              <View style={[styles.privacyBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <Text style={{ fontSize: 13, lineHeight: 18, color: theme.muted }}>
                  🔒 <Text style={{ fontWeight: '800', color: theme.text }}>100% Privado en iOS:</Text> Por políticas de seguridad de Apple, las apps no leen tus SMS en segundo plano. Simplemente copia el mensaje bancario y toca el botón abajo.
                </Text>
              </View>

              {/* BOTÓN MÁGICO 1 TOQUE: PEGAR DESDE PORTAPAPELES */}
              <TouchableOpacity
                style={[styles.btnClipboardMagic, { backgroundColor: theme.green }]}
                onPress={handlePasteFromClipboard}
                activeOpacity={0.8}
              >
                <Text style={styles.btnClipboardMagicText}>📋 Pegar desde Portapapeles (1 Toque)</Text>
              </TouchableOpacity>

              {/* EJEMPLO GENÉRICO DE PRUEBA RÁPIDA (1 SOLO BOTÓN) */}
              <TouchableOpacity
                style={[styles.sampleBtnSingle, { backgroundColor: theme.bg, borderColor: theme.border, marginTop: 14 }]}
                onPress={() => handleLoadSample(SAMPLE_BANK_NOTIFICATIONS[0].text)}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 20 }}>⚡</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: theme.text }}>
                      Probar Notificación de Ejemplo
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.muted, marginTop: 1 }}>
                      {SAMPLE_BANK_NOTIFICATIONS[0].title}
                    </Text>
                  </View>
                  <View style={[styles.badgeFree, { backgroundColor: theme.greenSoft }]}>
                    <Text style={{ fontSize: 11, color: theme.green, fontWeight: '800' }}>Cargar ↵</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* ÁREA DE TEXTO MANUAL */}
              <Text style={{ fontSize: 12, fontWeight: '700', color: theme.muted, marginTop: 16, marginBottom: 6 }}>
                Texto de la notificación:
              </Text>
              <TextInput
                style={[styles.scannerInput, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
                placeholder="Pega aquí el mensaje de texto o correo de tu banco..."
                placeholderTextColor={theme.muted}
                multiline
                numberOfLines={3}
                value={pastedNotification}
                onChangeText={setPastedNotification}
              />

              <TouchableOpacity
                style={[styles.btnAnalyze, { backgroundColor: theme.cardSubtle, borderColor: theme.border }]}
                onPress={handleAnalyzeNotification}
              >
                <Text style={{ color: theme.text, fontWeight: '800', fontSize: 13 }}>🔍 Analizar Texto Manual</Text>
              </TouchableOpacity>
            </View>

            {/* LISTA DE MOVIMIENTOS DETECTADOS CON BOTONES DE ELIMINAR / DESCARTAR */}
            <View style={{ marginTop: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Detectados ({detectedNotifications.length})
                </Text>
                {detectedNotifications.length > 0 && (
                  <TouchableOpacity
                    style={[styles.btnClearDetected, { borderColor: theme.border }]}
                    onPress={handleClearAllDetected}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.red }}>🗑️ Limpiar lista</Text>
                  </TouchableOpacity>
                )}
              </View>

              {detectedNotifications.map((d) => (
                <View key={d.id} style={[styles.detectedCard, { backgroundColor: theme.card, borderColor: theme.border }, theme.shadow]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={[styles.bankBadge, { backgroundColor: theme.greenSoft }]}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: theme.green }}>🏦 {d.entidad}</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: theme.muted }}>{d.fecha}</Text>
                  </View>

                  <View style={{ marginVertical: 10 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text }}>{d.descripcionSugerida}</Text>
                    <Text style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>Categoría sugerida: {d.categoriaSugerida}</Text>
                  </View>

                  <View style={styles.detectedActionsRow}>
                    <Text style={{ fontSize: 20, fontWeight: '900', color: theme.text }}>{formatCOP(d.monto)}</Text>
                    
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <TouchableOpacity
                        style={[styles.btnDiscardDetected, { borderColor: theme.border }]}
                        onPress={() => handleDeleteDetected(d.id)}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.red }}>✕ Descartar</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.btnImport, { backgroundColor: d.imported ? theme.cardSubtle : theme.green }]}
                        disabled={d.imported}
                        onPress={() => handleImportDetectedToMonth(d)}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '800', color: d.imported ? theme.muted : '#FFF' }}>
                          {d.imported ? '✓ Agregado' : '＋ Agregar'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}

              {detectedNotifications.length === 0 && (
                <View style={[styles.emptyStateCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>📲</Text>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: theme.text }}>Ninguna notificación analizada aún</Text>
                  <Text style={{ fontSize: 13, color: theme.muted, textAlign: 'center', marginTop: 4 }}>
                    Toca "Pegar desde Portapapeles" o prueba uno de los botones de bancos arriba.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* PESTAÑA 3 DEL HUB: MI CUENTA, NUBE, HISTORIAL Y PREFERENCIAS */}
        {hubTab === 'cuenta' && (
          <View style={isDesktop ? styles.desktopTabWrapper : undefined}>
            {/* Header Cuenta */}
            <View style={[styles.hubHeaderBanner, { backgroundColor: theme.card, borderColor: theme.border }, theme.shadow]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity
                  style={[styles.bigAvatar, { backgroundColor: theme.greenSoft }]}
                  onPress={() => setShowAvatarPickerModal(true)}
                  activeOpacity={0.8}
                  accessibilityLabel="Cambiar emoticon de usuario"
                >
                  <Text style={[styles.bigAvatarText, { color: theme.green }]}>
                    {userProfile?.avatarEmoji || (userProfile?.nombre ? userProfile.nombre.charAt(0).toUpperCase() : '👤')}
                  </Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  {isEditingUserName ? (
                    <View style={{ gap: 6, marginVertical: 4 }}>
                      <TextInput
                        style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text, paddingVertical: 6, paddingHorizontal: 10, marginBottom: 0 }]}
                        value={editUserName}
                        onChangeText={setEditUserName}
                        placeholder="Tu nombre de usuario"
                        placeholderTextColor={theme.muted}
                        autoFocus
                      />
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity
                          style={[styles.btnSaveTx, { backgroundColor: theme.green, paddingHorizontal: 12, paddingVertical: 6 }]}
                          onPress={handleSaveUserName}
                        >
                          <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 11 }}>Guardar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.btnCancel, { borderColor: theme.border, paddingHorizontal: 10, paddingVertical: 6 }]}
                          onPress={() => setIsEditingUserName(false)}
                        >
                          <Text style={{ color: theme.muted, fontWeight: '700', fontSize: 11 }}>Cancelar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <Text style={[styles.hubHeaderTitle, { color: theme.text, flex: 1 }]} numberOfLines={1}>
                        {userProfile ? userProfile.nombre : 'Usuario de Finanzas'}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setEditUserName(userProfile ? userProfile.nombre : 'Usuario');
                          setIsEditingUserName(true);
                        }}
                        style={{ paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, backgroundColor: theme.cardSubtle, borderWidth: 1, borderColor: theme.border }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel="Cambiar nombre de usuario"
                      >
                        <Text style={{ fontSize: 11, color: theme.green, fontWeight: '800' }}>✏️ Cambiar Nombre</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <Text style={[styles.hubHeaderSub, { color: theme.muted }]} numberOfLines={1}>
                    {userProfile?.email ? userProfile.email : 'Modo local en este dispositivo'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <View style={[styles.activeStatusDot, { backgroundColor: (userProfile && !userProfile.id.startsWith('user_')) ? theme.green : theme.amber }]} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: (userProfile && !userProfile.id.startsWith('user_')) ? theme.green : theme.amber }}>
                      {(userProfile && !userProfile.id.startsWith('user_')) ? 'Sincronizado en la Nube ☁️' : 'Modo Local 💾'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* SELECTOR RÁPIDO DE AVATAR / EMOTICON */}
              <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text }}>🎭 Emoticon / Avatar Personalizado:</Text>
                  <TouchableOpacity onPress={() => setShowAvatarPickerModal(true)}>
                    <Text style={{ fontSize: 11, color: theme.green, fontWeight: '700' }}>Ver todos ➜</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
                  {AVATAR_EMOJI_PALETTE.slice(0, 10).map((emoji, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.avatarEmojiChip,
                        {
                          backgroundColor: userProfile?.avatarEmoji === emoji ? theme.greenSoft : theme.bg,
                          borderColor: userProfile?.avatarEmoji === emoji ? theme.green : theme.border
                        }
                      ]}
                      onPress={() => handleSelectAvatarEmoji(emoji)}
                    >
                      <Text style={{ fontSize: 18 }}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Botón Iniciar Sesión / Sincronizar */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                {(!userProfile || userProfile.id.startsWith('user_')) ? (
                  <>
                    <TouchableOpacity
                      style={[styles.btnSyncNow, { backgroundColor: theme.green, flex: 1 }]}
                      onPress={() => {
                        setAuthTab('login');
                        setShowAuthModal(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>🔐 Iniciar Sesión</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btnSyncNow, { backgroundColor: theme.cardSubtle, borderColor: theme.border, borderWidth: 1, flex: 1 }]}
                      onPress={() => {
                        setAuthTab('register');
                        setShowAuthModal(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: theme.text, fontWeight: '800', fontSize: 13 }}>✨ Crear Cuenta</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.btnSyncNow, { backgroundColor: theme.green, flex: 1 }]}
                      onPress={handleManualSync}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>🔄 Sincronizar Nube</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btnCancel, { borderColor: theme.border, paddingHorizontal: 16, justifyContent: 'center' }]}
                      onPress={handleLogout}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: theme.red, fontWeight: '700', fontSize: 12 }}>Salir</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>

            {/* SECCIÓN 1 DE CUENTA: CONFIGURACIÓN FINANCIERA */}
            <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }, theme.shadow]}>
              <Text style={[styles.sectionHeading, { color: theme.text }]}>⚙️ Configuración Financiera</Text>
              <Text style={[styles.sectionSubHeading, { color: theme.muted }]}>
                Ajusta tu sueldo base, revisa meses anteriores y descarga reportes
              </Text>

              {/* Sueldo Base y Ciclo Financiero */}
              <TouchableOpacity
                style={[styles.cuentaOptionRow, { backgroundColor: theme.bg, borderColor: theme.border }]}
                onPress={openSetupModal}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <Text style={{ fontSize: 22 }}>💵</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>Salario Base y Ciclo de Pago</Text>
                    <Text style={{ fontSize: 12, color: theme.green, fontWeight: '700', marginTop: 2 }}>
                      {formatCOP(currentMonth.sueldoBase || 0)} • Inicia día {currentMonth.cicloDiaInicio || 1} ({currentMonth.cicloFrecuencia || 'mensual'})
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: theme.muted, fontWeight: '700' }}>Modificar ✏️</Text>
              </TouchableOpacity>

              {/* Exportar a Excel */}
              <TouchableOpacity
                style={[styles.cuentaOptionRow, { backgroundColor: theme.bg, borderColor: theme.border, marginTop: 10 }]}
                onPress={handleExportExcel}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <Text style={{ fontSize: 22 }}>📊</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>Exportar Libro a Excel (.xlsx)</Text>
                    <Text style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>
                      Descarga tu balance completo con fórmulas para tu contador o archivo
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: theme.green, fontWeight: '800' }}>Descargar 📥</Text>
              </TouchableOpacity>
            </View>

            {/* SECCIÓN 2 DE CUENTA: HISTORIAL DE MESES (COMPARADOR MES A MES) */}
            <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }, theme.shadow]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionHeading, { color: theme.text }]}>📅 Historial de Meses ({months.length})</Text>
                  <Text style={[styles.sectionSubHeading, { color: theme.muted }]}>
                    Toca cualquier mes para consultarlo o gestionarlo
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.btnAddGoal, { backgroundColor: theme.cardSubtle, borderColor: theme.border, paddingHorizontal: 12, paddingVertical: 6 }]}
                  onPress={() => setShowMonthModal(true)}
                >
                  <Text style={{ fontSize: 12, color: theme.green, fontWeight: '800' }}>＋ Nuevo Mes</Text>
                </TouchableOpacity>
              </View>

              <View style={{ gap: 8, marginTop: 10 }}>
                {(months || []).map(m => {
                  const ing = (m.movimientos || []).filter(t => String(t.tipo || '').toLowerCase() === 'ingreso').reduce((a, b) => a + (Number(b.monto) || 0), 0);
                  const egr = (m.movimientos || []).filter(t => String(t.tipo || '').toLowerCase() !== 'ingreso').reduce((a, b) => a + (Number(b.monto) || 0), 0);
                  const lib = ing - egr;
                  const isActive = m.id === currentMonth.id;

                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        styles.compareRowCard,
                        { backgroundColor: theme.bg, borderColor: isActive ? theme.green : theme.border },
                        isActive && { borderWidth: 2 }
                      ]}
                      onPress={() => {
                        handleSelectMonth(m.id);
                        setHubTab('resumen');
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>{m.nombre}</Text>
                          {isActive && <Text style={{ fontSize: 10, color: theme.green, fontWeight: '800' }}>● Mes Activo</Text>}
                        </View>
                        <Text style={{ fontSize: 11, color: theme.muted, marginTop: 3 }}>
                          Ingresos: {formatCOP(ing)} · Gastos: {formatCOP(egr)}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 15, fontWeight: '900', color: lib >= 0 ? theme.green : theme.red }}>
                          {formatCOP(lib)}
                        </Text>
                        <Text style={{ fontSize: 10, color: theme.muted }}>libre</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* SECCIÓN 3 DE CUENTA: PREFERENCIAS & PRIVACIDAD */}
            <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }, theme.shadow]}>
              <Text style={[styles.sectionHeading, { color: theme.text }]}>🎨 Apariencia y Privacidad</Text>
              <Text style={[styles.sectionSubHeading, { color: theme.muted }]}>
                Personaliza la interfaz y qué cifras mostrar u ocultar en pantalla
              </Text>

              {/* Tema Oscuro / Claro */}
              <TouchableOpacity
                style={[styles.cuentaOptionRow, { backgroundColor: theme.bg, borderColor: theme.border }]}
                onPress={toggleThemeMode}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <Text style={{ fontSize: 22 }}>{theme.isDark ? '🌙' : '☀️'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>Tema Visual</Text>
                    <Text style={{ fontSize: 11, color: theme.muted, marginTop: 1 }}>
                      Actualmente: {theme.isDark ? 'Modo Oscuro (OLED)' : 'Modo Claro'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.themePill, { backgroundColor: theme.cardSubtle, borderColor: theme.border }]}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: theme.text }}>
                    {theme.isDark ? '☀️ Cambiar a Claro' : '🌙 Cambiar a Oscuro'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Control de Privacidad por Sección */}
              <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: theme.text }}>🙈 Privacidad Independiente de Cifras</Text>
                    <Text style={{ fontSize: 11, color: theme.muted }}>
                      Escoge con precisión qué áreas ocultar al abrir la app en público:
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.btnImportSubs, { backgroundColor: theme.cardSubtle, borderColor: theme.border, borderWidth: 1 }]}
                    onPress={toggleMasterPrivacy}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '800', color: theme.text }}>
                      {isAnySectionHidden ? 'Mostrar Todo 👁️' : 'Ocultar Todo 🙈'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.privacyToggleRow, { backgroundColor: theme.bg, borderColor: theme.border }]}
                    onPress={() => toggleSectionPrivacy('disponible')}
                  >
                    <Text style={{ fontSize: 13, color: theme.text, fontWeight: '700' }}>💳 Saldo Disponible</Text>
                    <Text style={{ fontSize: 12, color: privacySections.disponible ? theme.red : theme.green, fontWeight: '800' }}>
                      {privacySections.disponible ? '🙈 Oculto' : '👁️ Visible'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.privacyToggleRow, { backgroundColor: theme.bg, borderColor: theme.border }]}
                    onPress={() => toggleSectionPrivacy('ingresos')}
                  >
                    <Text style={{ fontSize: 13, color: theme.text, fontWeight: '700' }}>💰 Total de Ingresos</Text>
                    <Text style={{ fontSize: 12, color: privacySections.ingresos ? theme.red : theme.green, fontWeight: '800' }}>
                      {privacySections.ingresos ? '🙈 Oculto' : '👁️ Visible'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.privacyToggleRow, { backgroundColor: theme.bg, borderColor: theme.border }]}
                    onPress={() => toggleSectionPrivacy('compromisos')}
                  >
                    <Text style={{ fontSize: 13, color: theme.text, fontWeight: '700' }}>💸 Total de Compromisos</Text>
                    <Text style={{ fontSize: 12, color: privacySections.compromisos ? theme.red : theme.green, fontWeight: '800' }}>
                      {privacySections.compromisos ? '🙈 Oculto' : '👁️ Visible'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.privacyToggleRow, { backgroundColor: theme.bg, borderColor: theme.border }]}
                    onPress={() => toggleSectionPrivacy('metas')}
                  >
                    <Text style={{ fontSize: 13, color: theme.text, fontWeight: '700' }}>🎯 Metas de Ahorro</Text>
                    <Text style={{ fontSize: 12, color: privacySections.metas ? theme.red : theme.green, fontWeight: '800' }}>
                      {privacySections.metas ? '🙈 Oculto' : '👁️ Visible'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Posición del Botón Flotante de Registro Rápido */}
              <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.border }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: theme.text }}>📍 Posición del Botón Rápido (⚡)</Text>
                <Text style={{ fontSize: 11, color: theme.muted, marginBottom: 10, marginTop: 2 }}>
                  Acomoda el botón flotante en la pantalla según tu comodidad (diestros o zurdos):
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[
                    { id: 'izquierda' as FabPosition, label: '👈 Izquierda', sub: 'Zurdos' },
                    { id: 'centro' as FabPosition, label: '🎯 Centro', sub: 'Equilibrado' },
                    { id: 'derecha' as FabPosition, label: '👉 Derecha', sub: 'Diestros' }
                  ].map(opt => (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        styles.fabPosChip,
                        {
                          backgroundColor: fabPosition === opt.id ? theme.greenSoft : theme.bg,
                          borderColor: fabPosition === opt.id ? theme.green : theme.border,
                          borderWidth: fabPosition === opt.id ? 2 : 1
                        }
                      ]}
                      onPress={() => handleChangeFabPosition(opt.id)}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '800', color: fabPosition === opt.id ? theme.green : theme.text }}>
                        {opt.label}
                      </Text>
                      <Text style={{ fontSize: 10, color: theme.muted }}>{opt.sub}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Botón Tour y Guía */}
              <TouchableOpacity
                style={[styles.cuentaOptionRow, { backgroundColor: theme.bg, borderColor: theme.border, marginTop: 14 }]}
                onPress={() => {
                  setTutorialStep(0);
                  setShowTutorialModal(true);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <Text style={{ fontSize: 22 }}>✨</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>Guía y Tour Interactivo</Text>
                    <Text style={{ fontSize: 11, color: theme.muted, marginTop: 1 }}>
                      Aprende a usar el teclado rápido, sobres, opciones PRO y pagos
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: theme.green, fontWeight: '800' }}>Ver Tour 🚀</Text>
              </TouchableOpacity>
            </View>

            {/* Pie de página de Cuenta */}
            <View style={{ alignItems: 'center', paddingVertical: 18 }}>
              <TouchableOpacity
                onPress={() => Linking.openURL('https://contamepues.com/')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: theme.cardSubtle, borderWidth: 1, borderColor: theme.border }}
              >
                <Text style={{ fontSize: 13 }}>👷</Text>
                <Text style={{ fontSize: 12, color: theme.accent, fontWeight: '800' }}>Visitar contamepues.com 🌐</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 12, color: theme.muted, fontWeight: '700' }}>
                Finanzas Contame Pues v1.0.0 • Colombia 🇨🇴
              </Text>
              <Text style={{ fontSize: 11, color: theme.muted, marginTop: 3 }}>
                Todo sobre seguridad, salud laboral y control financiero
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                <TouchableOpacity onPress={() => Linking.openURL('/privacy.html')}>
                  <Text style={{ fontSize: 11, color: theme.accent, fontWeight: '700' }}>Privacidad</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 11, color: theme.muted }}>•</Text>
                <TouchableOpacity onPress={() => Linking.openURL('/terms.html')}>
                  <Text style={{ fontSize: 11, color: theme.accent, fontWeight: '700' }}>Términos y Condiciones</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 11, color: theme.muted }}>•</Text>
                <TouchableOpacity onPress={() => Linking.openURL('/delete-account.html')}>
                  <Text style={{ fontSize: 11, color: theme.muted, fontWeight: '700' }}>Eliminar Cuenta</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: isDesktop ? 24 : 110 }} />
      </ScrollView>

      {/* HUB INFERIOR DE NAVEGACIÓN MODERNA (SOLO EN MÓVIL Y TABLET) */}
      {!isDesktop && (
        <View
          style={[
            styles.floatingDock,
            {
              backgroundColor: theme.dockBg,
              borderColor: theme.dockBorder,
              ...(Platform.OS === 'web' ? {
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                boxShadow: theme.isDark
                  ? '0 12px 36px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.08)'
                  : '0 8px 30px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.06)'
              } : {})
            },
            theme.shadow
          ]}
        >
          <TouchableOpacity
            style={[
              styles.dockTab,
              hubTab === 'resumen' && {
                backgroundColor: theme.isDark ? theme.brandSoft : '#FEF3C7',
                borderColor: '#F6AC13',
                borderWidth: 1
              }
            ]}
            onPress={() => setHubTab('resumen')}
            activeOpacity={0.7}
          >
            <Text style={styles.dockTabIcon}>💳</Text>
            <Text
              style={[
                styles.dockTabText,
                {
                  color: hubTab === 'resumen' ? (theme.isDark ? '#F6AC13' : '#92400E') : theme.muted,
                  fontWeight: hubTab === 'resumen' ? '900' : '600'
                }
              ]}
            >
              Resumen
            </Text>
            {hubTab === 'resumen' && (
              <View style={[styles.dockActiveDot, { backgroundColor: '#F6AC13' }]} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dockTab,
              hubTab === 'pro' && {
                backgroundColor: theme.isDark ? theme.brandSoft : '#FEF3C7',
                borderColor: '#F6AC13',
                borderWidth: 1
              }
            ]}
            onPress={() => setHubTab('pro')}
            activeOpacity={0.7}
          >
            <Text style={styles.dockTabIcon}>⚡</Text>
            <Text
              style={[
                styles.dockTabText,
                {
                  color: hubTab === 'pro' ? (theme.isDark ? '#F6AC13' : '#92400E') : theme.muted,
                  fontWeight: hubTab === 'pro' ? '900' : '600'
                }
              ]}
            >
              Opciones PRO
            </Text>
            {hubTab === 'pro' && (
              <View style={[styles.dockActiveDot, { backgroundColor: '#F6AC13' }]} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dockTab,
              hubTab === 'cuenta' && {
                backgroundColor: theme.isDark ? theme.brandSoft : '#FEF3C7',
                borderColor: '#F6AC13',
                borderWidth: 1
              }
            ]}
            onPress={() => setHubTab('cuenta')}
            activeOpacity={0.7}
          >
            <Text style={styles.dockTabIcon}>👤</Text>
            <Text
              style={[
                styles.dockTabText,
                {
                  color: hubTab === 'cuenta' ? (theme.isDark ? '#F6AC13' : '#92400E') : theme.muted,
                  fontWeight: hubTab === 'cuenta' ? '900' : '600'
                }
              ]}
            >
              Mi Cuenta
            </Text>
            {hubTab === 'cuenta' && (
              <View style={[styles.dockActiveDot, { backgroundColor: '#F6AC13' }]} />
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* MODAL 0: CREAR CUENTA / INICIAR SESIÓN CON CORREO */}
      <Modal visible={showAuthModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border, maxWidth: 460 }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {(userProfile && !userProfile.id.startsWith('user_'))
                  ? '👤 Mi Cuenta'
                  : authTab === 'login'
                  ? '🔐 Iniciar Sesión'
                  : authTab === 'register'
                  ? '✨ Crear Cuenta Gratis'
                  : '🔑 Recuperar Contraseña'}
              </Text>
              <TouchableOpacity onPress={() => setShowAuthModal(false)}>
                <Text style={{ fontSize: 18, color: theme.muted, padding: 4 }}>✕</Text>
              </TouchableOpacity>
            </View>

            {(userProfile && !userProfile.id.startsWith('user_')) ? (
              /* VISTA DE PERFIL CUANDO ESTÁ AUTENTICADO */
              <View style={{ marginVertical: 8 }}>
                <View style={[styles.profileHeaderCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <View style={[styles.bigAvatar, { backgroundColor: userProfile.id.startsWith('user_') ? '#FEF3C7' : theme.greenSoft }]}>
                    <Text style={[styles.bigAvatarText, { color: userProfile.id.startsWith('user_') ? '#D97706' : theme.green }]}>
                      {userProfile.nombre.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    {isEditingUserName ? (
                      <View style={{ gap: 6, marginBottom: 4 }}>
                        <TextInput
                          style={[styles.inputField, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text, paddingVertical: 6, marginBottom: 0 }]}
                          value={editUserName}
                          onChangeText={setEditUserName}
                          placeholder="Tu nombre de usuario"
                          placeholderTextColor={theme.muted}
                        />
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <TouchableOpacity
                            style={[styles.btnSaveTx, { backgroundColor: theme.green, paddingHorizontal: 12, paddingVertical: 6 }]}
                            onPress={handleSaveUserName}
                          >
                            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 11 }}>Guardar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.btnCancel, { borderColor: theme.border, paddingHorizontal: 10, paddingVertical: 6 }]}
                            onPress={() => setIsEditingUserName(false)}
                          >
                            <Text style={{ color: theme.muted, fontWeight: '700', fontSize: 11 }}>Cancelar</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={[styles.profileName, { color: theme.text }]}>{userProfile.nombre}</Text>
                        <TouchableOpacity
                          onPress={() => {
                            setEditUserName(userProfile.nombre);
                            setIsEditingUserName(true);
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={{ fontSize: 12, color: theme.green, fontWeight: '800' }}>✏️ Cambiar Nombre</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    <Text style={[styles.profileEmail, { color: theme.muted, marginTop: 2 }]}>
                      {userProfile.email} 🔒 (Correo asociado)
                    </Text>
                    <View style={styles.profileBadgeRow}>
                      <View style={[styles.activeStatusDot, { backgroundColor: userProfile.id.startsWith('user_') ? '#F59E0B' : theme.green }]} />
                      <Text style={[styles.activeStatusText, { color: userProfile.id.startsWith('user_') ? '#F59E0B' : theme.green }]}>
                        {userProfile.id.startsWith('user_') ? 'Modo Local (Pendiente sincronizar)' : 'Sincronizado en la nube ☁️'}
                      </Text>
                    </View>
                  </View>
                </View>

                {userProfile.id.startsWith('user_') ? (
                  /* CAJA DE MIGRACIÓN PARA USUARIOS ANTERIORES */
                  <View style={[styles.syncExplainBox, { backgroundColor: theme.cardSubtle, borderColor: '#F59E0B', borderWidth: 1, padding: 14, borderRadius: 14, marginVertical: 10, flexDirection: 'column', alignItems: 'stretch' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Text style={{ fontSize: 16 }}>⚠️</Text>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: theme.text }}>
                        Cuenta no respaldada en la nube
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: theme.muted, lineHeight: 18, marginBottom: 12 }}>
                      Creaste tu perfil antes de activar la sincronización en la nube. Para respaldar tus datos entre celular y computador, crea tu contraseña para conectarla con la nube:
                    </Text>

                    <TextInput
                      style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text, marginBottom: 10 }]}
                      placeholder="Contraseña (mínimo 6 caracteres)"
                      placeholderTextColor={theme.muted}
                      value={regPassword}
                      onChangeText={setRegPassword}
                      secureTextEntry
                    />

                    <TouchableOpacity
                      style={[styles.btnSyncNow, { backgroundColor: theme.green, alignItems: 'center', opacity: authLoading ? 0.7 : 1 }]}
                      onPress={handleMigrateLocalToFirebase}
                      disabled={authLoading}
                      activeOpacity={0.8}
                    >
                      {authLoading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>☁️ Vincular y Respaldar en la Nube Ahora</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    {/* Explicación de sincronización con la nube */}
                    <View style={[styles.syncExplainBox, { backgroundColor: theme.cardSubtle, borderColor: theme.border }]}>
                      <Text style={{ fontSize: 18 }}>☁️</Text>
                      <Text style={{ fontSize: 12, color: theme.muted, lineHeight: 17, flex: 1 }}>
                        Tus gastos, ingresos y metas están respaldados en la nube bajo el correo <Text style={{ fontWeight: '800', color: theme.text }}>{userProfile.email}</Text>. Puedes acceder desde cualquier dispositivo o navegador.
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.btnSyncNow, { backgroundColor: theme.green }]}
                      onPress={handleManualSync}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>🔄 Sincronizar con la Nube</Text>
                    </TouchableOpacity>

                    {/* Botón para Restablecer / Cambiar Contraseña */}
                    <TouchableOpacity
                      style={[styles.btnCancel, { borderColor: theme.border, width: '100%', alignItems: 'center', marginTop: 10, paddingVertical: 11 }]}
                      onPress={handleSendPasswordResetFromProfile}
                    >
                      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 12 }}>
                        🔑 Restablecer / Cambiar Contraseña por Correo
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity
                  style={[styles.btnDeleteTx, { borderColor: theme.redSoft, width: '100%', alignItems: 'center', marginTop: 12 }]}
                  onPress={handleLogout}
                >
                  <Text style={{ color: theme.red, fontWeight: '800' }}>🔒 Cerrar Sesión y Proteger Datos</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* PESTAÑAS: CREAR CUENTA / INICIAR SESIÓN / OLVIDÓ CONTRASEÑA */
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
                {authTab !== 'forgot' && (
                  <View style={[styles.segmentRow, { marginTop: 8 }]}>
                    <TouchableOpacity
                      style={[styles.segmentBtn, authTab === 'login' && { backgroundColor: theme.accent }]}
                      onPress={() => setAuthTab('login')}
                    >
                      <Text style={{ color: authTab === 'login' ? theme.accentText : theme.muted, fontWeight: '800' }}>
                        🔐 Iniciar Sesión
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.segmentBtn, authTab === 'register' && { backgroundColor: theme.accent }]}
                      onPress={() => setAuthTab('register')}
                    >
                      <Text style={{ color: authTab === 'register' ? theme.accentText : theme.muted, fontWeight: '800' }}>
                        ✨ Crear Cuenta
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {authTab === 'register' && (
                  /* FORMULARIO: CREAR CUENTA */
                  <View style={{ marginTop: 6 }}>
                    <Text style={{ fontSize: 12, color: theme.muted, lineHeight: 18, marginBottom: 12 }}>
                      Crea tu cuenta con tu correo para asociar tus finanzas y habilitar el respaldo automático en la nube.
                    </Text>

                    <Text style={[styles.fieldLabel, { color: theme.muted }]}>Nombre de Usuario</Text>
                    <TextInput
                      style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
                      placeholder="Tu nombre o apodo"
                      placeholderTextColor={theme.muted}
                      value={regName}
                      onChangeText={setRegName}
                    />

                    <Text style={[styles.fieldLabel, { color: theme.muted }]}>Correo Electrónico</Text>
                    <TextInput
                      style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
                      placeholder="correo@ejemplo.com"
                      placeholderTextColor={theme.muted}
                      value={regEmail}
                      onChangeText={setRegEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />

                    <Text style={[styles.fieldLabel, { color: theme.muted }]}>Contraseña (Mínimo 6 caracteres)</Text>
                    <TextInput
                      style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
                      placeholder="••••••••"
                      placeholderTextColor={theme.muted}
                      value={regPassword}
                      onChangeText={setRegPassword}
                      secureTextEntry
                    />

                    <TouchableOpacity
                      style={[styles.btnSaveTx, { backgroundColor: theme.green, alignItems: 'center', marginTop: 16, opacity: authLoading ? 0.7 : 1 }]}
                      onPress={handleRegisterAccount}
                      disabled={authLoading}
                      activeOpacity={0.8}
                    >
                      {authLoading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 14 }}>✨ Crear mi Cuenta Gratis</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{ marginTop: 14, alignItems: 'center' }}
                      onPress={() => setAuthTab('login')}
                    >
                      <Text style={{ fontSize: 12, color: theme.text, fontWeight: '600' }}>
                        ¿Ya tienes una cuenta? <Text style={{ color: theme.green, fontWeight: '800' }}>Iniciar Sesión</Text>
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {authTab === 'login' && (
                  /* FORMULARIO: INICIAR SESIÓN */
                  <View style={{ marginTop: 6 }}>
                    <Text style={{ fontSize: 12, color: theme.muted, lineHeight: 18, marginBottom: 12 }}>
                      Ingresa con tu correo registrado para sincronizar tus finanzas desde la nube.
                    </Text>

                    <Text style={[styles.fieldLabel, { color: theme.muted }]}>Correo Electrónico</Text>
                    <TextInput
                      style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
                      placeholder="correo@ejemplo.com"
                      placeholderTextColor={theme.muted}
                      value={loginEmail}
                      onChangeText={setLoginEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />

                    <Text style={[styles.fieldLabel, { color: theme.muted }]}>Contraseña</Text>
                    <TextInput
                      style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
                      placeholder="••••••••"
                      placeholderTextColor={theme.muted}
                      value={loginPassword}
                      onChangeText={setLoginPassword}
                      secureTextEntry
                    />

                    {/* Enlace para Olvido de Contraseña */}
                    <TouchableOpacity
                      style={{ alignSelf: 'flex-end', marginTop: 2, marginBottom: 10 }}
                      onPress={() => {
                        setForgotEmail(loginEmail);
                        setAuthTab('forgot');
                      }}
                    >
                      <Text style={{ fontSize: 11, color: theme.green, fontWeight: '700' }}>
                        ¿Olvidaste tu contraseña? Restablecer aquí
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btnSaveTx, { backgroundColor: theme.green, alignItems: 'center', marginTop: 6, opacity: authLoading ? 0.7 : 1 }]}
                      onPress={handleLoginAccount}
                      disabled={authLoading}
                      activeOpacity={0.8}
                    >
                      {authLoading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 14 }}>🔐 Entrar a mi Cuenta</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{ marginTop: 14, alignItems: 'center' }}
                      onPress={() => setAuthTab('register')}
                    >
                      <Text style={{ fontSize: 12, color: theme.text, fontWeight: '600' }}>
                        ¿No tienes una cuenta aún? <Text style={{ color: theme.green, fontWeight: '800' }}>Crear Cuenta Gratis</Text>
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {authTab === 'forgot' && (
                  /* FORMULARIO: RESTABLECER CONTRASEÑA */
                  <View style={{ marginTop: 6 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text, marginBottom: 4 }}>
                      🔑 Recuperar Contraseña
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.muted, lineHeight: 18, marginBottom: 14 }}>
                      Ingresa tu correo registrado y te enviaremos un enlace oficial de recuperación para restablecer tu contraseña.
                    </Text>

                    <Text style={[styles.fieldLabel, { color: theme.muted }]}>Correo Electrónico Registrado</Text>
                    <TextInput
                      style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
                      placeholder="correo@ejemplo.com"
                      placeholderTextColor={theme.muted}
                      value={forgotEmail}
                      onChangeText={setForgotEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />

                    <TouchableOpacity
                      style={[styles.btnSaveTx, { backgroundColor: theme.green, alignItems: 'center', marginTop: 14, opacity: authLoading ? 0.7 : 1 }]}
                      onPress={handleForgotSubmit}
                      disabled={authLoading}
                      activeOpacity={0.8}
                    >
                      {authLoading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>📧 Enviar Enlace de Recuperación</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{ marginTop: 14, alignItems: 'center', paddingVertical: 6 }}
                      onPress={() => setAuthTab('login')}
                    >
                      <Text style={{ fontSize: 12, color: theme.green, fontWeight: '800' }}>
                        ‹ Volver a Iniciar Sesión
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={{ marginTop: 18, alignItems: 'center', paddingVertical: 6 }}
                  onPress={() => setShowAuthModal(false)}
                >
                  <Text style={{ fontSize: 12, color: theme.muted, fontWeight: '600' }}>
                    Continuar como invitado (100% privado y offline)
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 1: EDITAR MOVIMIENTO EXISTENTE */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>✏️ Editar Movimiento</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={{ fontSize: 18, color: theme.muted, padding: 4 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Selector Egreso / Ingreso */}
              <View style={styles.segmentRow}>
                <TouchableOpacity
                  style={[styles.segmentBtn, editTipo === 'Egreso' && { backgroundColor: theme.accent }]}
                  onPress={() => setEditTipo('Egreso')}
                >
                  <Text style={{ color: editTipo === 'Egreso' ? theme.accentText : theme.muted, fontWeight: '700' }}>💸 Egreso / Gasto</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentBtn, editTipo === 'Ingreso' && { backgroundColor: theme.accent }]}
                  onPress={() => setEditTipo('Ingreso')}
                >
                  <Text style={{ color: editTipo === 'Ingreso' ? theme.accentText : theme.muted, fontWeight: '700' }}>💰 Ingreso</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.fieldLabel, { color: theme.muted }]}>Nombre o Descripción</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
                value={editDesc}
                onChangeText={setEditDesc}
                placeholder="Ej. Arriendo, Mercado, Luz..."
                placeholderTextColor={theme.muted}
              />

              <Text style={[styles.fieldLabel, { color: theme.muted }]}>Monto en Pesos (COP)</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
                value={editMonto}
                onChangeText={setEditMonto}
                keyboardType="numeric"
                placeholder="Ej. 250000"
                placeholderTextColor={theme.muted}
              />

              <Text style={[styles.fieldLabel, { color: theme.muted }]}>Seleccionar Categoría Visual</Text>
              <View style={styles.catVisualGrid}>
                {CATEGORIAS_VISUALES.map((cv, idx) => {
                  const isSelected = (editCat || '').toLowerCase() === cv.nombre.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.catVisualBtn,
                        { backgroundColor: isSelected ? theme.accent : theme.bg, borderColor: isSelected ? theme.green : theme.border }
                      ]}
                      onPress={() => setEditCat(cv.nombre)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.catVisualEmoji}>{cv.emoji}</Text>
                      <Text
                        style={[
                          styles.catVisualText,
                          { color: isSelected ? theme.accentText : theme.text, fontWeight: isSelected ? '800' : '600' }
                        ]}
                        numberOfLines={1}
                      >
                        {cv.nombre}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, { color: theme.muted }]}>O escribe una categoría personalizada</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
                value={editCat}
                onChangeText={setEditCat}
                placeholder="Ej. Gastos fijos, Servicios..."
                placeholderTextColor={theme.muted}
              />

              {/* Estado de Pago */}
              <Text style={[styles.fieldLabel, { color: theme.muted }]}>Estado del Pago</Text>
              <View style={styles.segmentRow}>
                <TouchableOpacity
                  style={[styles.segmentBtn, !editPagado && { backgroundColor: theme.amber }]}
                  onPress={() => setEditPagado(false)}
                >
                  <Text style={{ color: !editPagado ? '#FFF' : theme.muted, fontWeight: '700' }}>⏳ Pendiente</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentBtn, editPagado && { backgroundColor: theme.green }]}
                  onPress={() => setEditPagado(true)}
                >
                  <Text style={{ color: editPagado ? '#FFF' : theme.muted, fontWeight: '700' }}>✓ Pagado</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalActionsRow}>
              {editingTx && (
                <TouchableOpacity
                  style={[styles.btnDeleteTx, { borderColor: theme.redSoft }]}
                  onPress={() => handleDeleteTx(editingTx.id)}
                >
                  <Text style={{ color: theme.red, fontWeight: '800' }}>🗑️ Eliminar</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.btnSaveTx, { backgroundColor: theme.green }]}
                onPress={handleSaveEditedTx}
              >
                <Text style={{ color: '#FFF', fontWeight: '800' }}>Guardar Cambios</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 2: EDITAR META DE AHORRO */}
      <Modal visible={showEditMetaModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>🎯 Editar Fondo / Meta</Text>
              <TouchableOpacity onPress={() => setShowEditMetaModal(false)}>
                <Text style={{ fontSize: 18, color: theme.muted, padding: 4 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { color: theme.muted }]}>Nombre de la Meta</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
              value={editMetaNombre}
              onChangeText={setEditMetaNombre}
              placeholder="Ej. Fondo de Emergencia, Vacaciones..."
              placeholderTextColor={theme.muted}
            />

            <Text style={[styles.fieldLabel, { color: theme.muted }]}>Monto Acumulado (COP)</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
              value={editMetaMonto}
              onChangeText={setEditMetaMonto}
              keyboardType="numeric"
              placeholder="Ej. 5000000"
              placeholderTextColor={theme.muted}
            />

            <View style={styles.modalActionsRow}>
              {editingMeta && (
                <TouchableOpacity
                  style={[styles.btnDeleteTx, { borderColor: theme.redSoft }]}
                  onPress={() => handleDeleteMeta(editingMeta.id)}
                >
                  <Text style={{ color: theme.red, fontWeight: '800' }}>🗑️ Eliminar</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.btnCancel, { borderColor: theme.border }]}
                onPress={() => setShowEditMetaModal(false)}
              >
                <Text style={{ color: theme.muted, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnSaveTx, { backgroundColor: theme.green }]}
                onPress={handleSaveMeta}
              >
                <Text style={{ color: '#FFF', fontWeight: '800' }}>Guardar Meta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 2B: CREAR NUEVA META DE AHORRO */}
      <Modal visible={showNewMetaModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>🎯 Nueva Meta de Ahorro</Text>
              <TouchableOpacity onPress={() => setShowNewMetaModal(false)}>
                <Text style={{ fontSize: 18, color: theme.muted, padding: 4 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 12, color: theme.muted, marginBottom: 12 }}>
              Define un objetivo o fondo de reserva para tu tranquilidad financiera.
            </Text>

            <Text style={[styles.fieldLabel, { color: theme.muted }]}>Nombre de la Meta</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
              value={newMetaName}
              onChangeText={setNewMetaName}
              placeholder="Ej. Viaje, Moto, Fondo de Emergencia..."
              placeholderTextColor={theme.muted}
            />

            <Text style={[styles.fieldLabel, { color: theme.muted }]}>Monto Inicial Ahorrado (COP)</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
              value={newMetaAmount}
              onChangeText={setNewMetaAmount}
              keyboardType="numeric"
              placeholder="Ej. 200000 (o 0)"
              placeholderTextColor={theme.muted}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.btnCancel, { borderColor: theme.border }]}
                onPress={() => setShowNewMetaModal(false)}
              >
                <Text style={{ color: theme.muted, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnSaveTx, { backgroundColor: theme.green }]}
                onPress={handleCreateNewMeta}
              >
                <Text style={{ color: '#FFF', fontWeight: '800' }}>Crear Meta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 3: AÑADIR NUEVO MOVIMIENTO */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>＋ Añadir Movimiento</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={{ fontSize: 18, color: theme.muted, padding: 4 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 12, color: theme.muted, marginBottom: 14 }}>Se agregará a {currentMonth.nombre}</Text>

            <View style={styles.segmentRow}>
              <TouchableOpacity
                style={[styles.segmentBtn, newTipo === 'Egreso' && { backgroundColor: theme.accent }]}
                onPress={() => setNewTipo('Egreso')}
              >
                <Text style={{ color: newTipo === 'Egreso' ? theme.accentText : theme.muted, fontWeight: '700' }}>💸 Egreso / Gasto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentBtn, newTipo === 'Ingreso' && { backgroundColor: theme.accent }]}
                onPress={() => setNewTipo('Ingreso')}
              >
                <Text style={{ color: newTipo === 'Ingreso' ? theme.accentText : theme.muted, fontWeight: '700' }}>💰 Ingreso</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { color: theme.muted }]}>Descripción</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
              value={newDesc}
              onChangeText={setNewDesc}
              placeholder="Ej. Mercado, Factura Celular, Gasolina..."
              placeholderTextColor={theme.muted}
            />

            <Text style={[styles.fieldLabel, { color: theme.muted }]}>Monto en Pesos (COP)</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
              value={newMonto}
              onChangeText={setNewMonto}
              keyboardType="numeric"
              placeholder="Ej. 120000"
              placeholderTextColor={theme.muted}
            />

            <Text style={[styles.fieldLabel, { color: theme.muted }]}>Fecha del Movimiento (Día)</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
              value={newTxDate}
              onChangeText={setNewTxDate}
              placeholder={`YYYY-MM-DD (Ej. ${monthYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(selectedDay || new Date().getDate()).padStart(2, '0')})`}
              placeholderTextColor={theme.muted}
            />

            <Text style={[styles.fieldLabel, { color: theme.muted }]}>Seleccionar Categoría Visual</Text>
            <View style={styles.catVisualGrid}>
              {CATEGORIAS_VISUALES.map((cv, idx) => {
                const isSelected = (newCat || '').toLowerCase() === cv.nombre.toLowerCase();
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.catVisualBtn,
                      { backgroundColor: isSelected ? theme.accent : theme.bg, borderColor: isSelected ? theme.green : theme.border }
                    ]}
                    onPress={() => setNewCat(cv.nombre)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.catVisualEmoji}>{cv.emoji}</Text>
                    <Text
                      style={[
                        styles.catVisualText,
                        { color: isSelected ? theme.accentText : theme.text, fontWeight: isSelected ? '800' : '600' }
                      ]}
                      numberOfLines={1}
                    >
                      {cv.nombre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { color: theme.muted }]}>O escribe una categoría personalizada</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
              value={newCat}
              onChangeText={setNewCat}
              placeholder="Ej. Supermercado, Factura Luz, Gasolina..."
              placeholderTextColor={theme.muted}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={[styles.btnCancel, { borderColor: theme.border }]} onPress={() => setShowAddModal(false)}>
                <Text style={{ color: theme.muted, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnSaveTx, { backgroundColor: theme.green }]} onPress={handleAddTransaction}>
                <Text style={{ color: '#FFF', fontWeight: '800' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 4: CONFIGURAR SUELDO BASE Y CICLO FINANCIERO */}
      <Modal visible={showSetupModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>⚙️ Sueldo y Ciclo Financiero</Text>
              <TouchableOpacity onPress={() => setShowSetupModal(false)}>
                <Text style={{ fontSize: 18, color: theme.muted, padding: 4 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 12, color: theme.muted, marginBottom: 14 }}>
              Configura tu ingreso base y las fechas en que inicia tu mes financiero.
            </Text>

            <Text style={[styles.fieldLabel, { color: theme.muted }]}>Sueldo Mensual Base (COP)</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
              value={setupSueldo}
              onChangeText={setSetupSueldo}
              keyboardType="numeric"
              placeholder="3000000"
              placeholderTextColor={theme.muted}
            />

            <Text style={[styles.fieldLabel, { color: theme.muted, marginTop: 6 }]}>¿En qué día inicia tu ciclo de mes?</Text>
            <Text style={{ fontSize: 11, color: theme.muted, marginBottom: 6 }}>
              Día en que recibes tu sueldo (ej. día 1, 15, 20 o 30):
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
              {[1, 5, 10, 15, 20, 25, 30].map(dia => (
                <TouchableOpacity
                  key={dia}
                  style={[
                    styles.rangeChip,
                    { backgroundColor: setupCicloDia === dia ? theme.green : theme.bg, borderColor: theme.border, flex: 1, alignItems: 'center' }
                  ]}
                  onPress={() => setSetupCicloDia(dia)}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: setupCicloDia === dia ? '#FFF' : theme.text }}>
                    {dia}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: theme.muted }]}>Frecuencia de Pago</Text>
            <View style={[styles.segmentRow, { marginBottom: 12 }]}>
              <TouchableOpacity
                style={[styles.segmentBtn, setupCicloFrecuencia === 'mensual' && { backgroundColor: theme.accent }]}
                onPress={() => setSetupCicloFrecuencia('mensual')}
              >
                <Text style={{ color: setupCicloFrecuencia === 'mensual' ? theme.accentText : theme.muted, fontWeight: '800', fontSize: 12 }}>
                  📅 Mensual (1 Pago)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentBtn, setupCicloFrecuencia === 'quincenal' && { backgroundColor: theme.accent }]}
                onPress={() => setSetupCicloFrecuencia('quincenal')}
              >
                <Text style={{ color: setupCicloFrecuencia === 'quincenal' ? theme.accentText : theme.muted, fontWeight: '800', fontSize: 12 }}>
                  ✌️ Quincenal (2 Pagos)
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, marginBottom: 16 }}
              onPress={() => setSetupIngresoRecurrente(prev => !prev)}
            >
              <View style={[styles.checkbox, { backgroundColor: setupIngresoRecurrente ? theme.green : 'transparent', borderColor: setupIngresoRecurrente ? theme.green : theme.border }]}>
                {setupIngresoRecurrente && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={{ fontSize: 12, color: theme.text, fontWeight: '700' }}>
                Ingreso recurrente automático en cada mes
              </Text>
            </TouchableOpacity>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={[styles.btnCancel, { borderColor: theme.border }]} onPress={() => setShowSetupModal(false)}>
                <Text style={{ color: theme.muted, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnSaveTx, { backgroundColor: theme.green }]} onPress={handleSaveSetup}>
                <Text style={{ color: '#FFF', fontWeight: '800' }}>Guardar Configuración</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 5: NUEVO MES */}
      <Modal visible={showMonthModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>📋 Crear Nuevo Mes</Text>
              <TouchableOpacity onPress={() => setShowMonthModal(false)}>
                <Text style={{ fontSize: 18, color: theme.muted, padding: 4 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: theme.muted, marginBottom: 14, lineHeight: 18 }}>
              Crea un nuevo mes duplicando tus compromisos fijos y sueldo, iniciando con todos los pagos en estado pendiente.
            </Text>

            <Text style={[styles.fieldLabel, { color: theme.muted }]}>Nombre del nuevo mes (Opcional)</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
              placeholder="Ej. Noviembre 2026 (o deja en blanco para automático)"
              placeholderTextColor={theme.muted}
              value={dupName}
              onChangeText={setDupName}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={[styles.btnCancel, { borderColor: theme.border }]} onPress={() => setShowMonthModal(false)}>
                <Text style={{ color: theme.muted, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnSaveTx, { backgroundColor: theme.green }]} onPress={handleDuplicateMonth}>
                <Text style={{ color: '#FFF', fontWeight: '800' }}>Crear Mes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 6: SELECTOR DE MES */}
      <Modal visible={showMonthPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text, marginBottom: 12 }]}>📅 Seleccionar Mes</Text>
            <ScrollView style={{ maxHeight: 300, marginVertical: 8 }}>
              {months.map(m => (
                <View
                  key={m.id}
                  style={[
                    styles.monthOption,
                    {
                      backgroundColor: m.id === currentMonth.id ? theme.greenSoft : theme.bg,
                      borderColor: theme.border,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingRight: 10
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={{ flex: 1, paddingVertical: 4 }}
                    onPress={() => handleSelectMonth(m.id)}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>{m.nombre}</Text>
                    {m.id === currentMonth.id && <Text style={{ color: theme.green, fontWeight: '800', fontSize: 11 }}>✓ Activo</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setShowMonthPicker(false);
                      handleOpenRenameMonth(m.id, m.nombre);
                    }}
                    style={{ paddingVertical: 5, paddingHorizontal: 9, borderRadius: 8, backgroundColor: theme.cardSubtle, borderWidth: 1, borderColor: theme.border }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Renombrar mes"
                  >
                    <Text style={{ fontSize: 11, color: theme.green, fontWeight: '700' }}>✏️ Renombrar</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.btnCancel, { borderColor: theme.border, marginTop: 10 }]} onPress={() => setShowMonthPicker(false)}>
              <Text style={{ color: theme.muted, fontWeight: '700', textAlign: 'center' }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL RENOMBRAR MES */}
      <Modal visible={showRenameMonthModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>✏️ Renombrar Mes</Text>
              <TouchableOpacity onPress={() => setShowRenameMonthModal(false)}>
                <Text style={{ fontSize: 18, color: theme.muted, padding: 4 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 12, color: theme.muted, marginBottom: 12 }}>
              Personaliza el nombre de este mes (ej. "Octubre Vacaciones", "Noviembre Aguinaldo", etc.)
            </Text>

            <Text style={[styles.fieldLabel, { color: theme.muted }]}>Nombre del Mes</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
              value={renameMonthInput}
              onChangeText={setRenameMonthInput}
              placeholder="Ej. Octubre 2026 - Aguinaldo"
              placeholderTextColor={theme.muted}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={[styles.btnCancel, { borderColor: theme.border }]} onPress={() => setShowRenameMonthModal(false)}>
                <Text style={{ color: theme.muted, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnSaveTx, { backgroundColor: theme.green }]} onPress={handleSaveRenameMonth}>
                <Text style={{ color: '#FFF', fontWeight: '800' }}>Guardar Nombre</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL SELECCIONAR EMOTICON / AVATAR DE USUARIO */}
      <Modal visible={showAvatarPickerModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border, maxWidth: 440 }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>🎭 Personaliza tu Avatar</Text>
              <TouchableOpacity onPress={() => setShowAvatarPickerModal(false)}>
                <Text style={{ fontSize: 18, color: theme.muted, padding: 4 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 12, color: theme.muted, marginBottom: 14 }}>
              Elige el emoticon que representará tu perfil en la app y barra superior:
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginVertical: 8 }}>
              {AVATAR_EMOJI_PALETTE.map((emoji, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.avatarGridItem,
                    {
                      backgroundColor: userProfile?.avatarEmoji === emoji ? theme.greenSoft : theme.bg,
                      borderColor: userProfile?.avatarEmoji === emoji ? theme.green : theme.border,
                      borderWidth: userProfile?.avatarEmoji === emoji ? 2 : 1
                    }
                  ]}
                  onPress={() => handleSelectAvatarEmoji(emoji)}
                >
                  <Text style={{ fontSize: 28 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.btnCancel, { borderColor: theme.border, marginTop: 14 }]}
              onPress={() => setShowAvatarPickerModal(false)}
            >
              <Text style={{ color: theme.muted, fontWeight: '700', textAlign: 'center' }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 7: TUTORIAL PASO A PASO (WIZARD INTERACTIVO) */}
      <Modal visible={showTutorialModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border, maxWidth: 460 }]}>
            {/* Header del Tutorial con indicador de paso */}
            <View style={styles.modalHeaderRow}>
              <View style={[styles.stepBadge, { backgroundColor: theme.greenSoft }]}>
                <Text style={[styles.stepBadgeText, { color: theme.green }]}>
                  PASO {tutorialStep + 1} DE 5
                </Text>
              </View>
              <TouchableOpacity
                onPress={async () => {
                  setShowTutorialModal(false);
                  await setFirstLaunchCompleted();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ fontSize: 13, color: theme.muted, fontWeight: '700' }}>Omitir ✕</Text>
              </TouchableOpacity>
            </View>

            {/* Contenido según el paso activo con ubicación dinámica */}
            {tutorialStep === 0 && (
              <View style={styles.tutorialStepContent}>
                <View style={[styles.tutorialLocationBadge, { backgroundColor: theme.cardSubtle }]}>
                  <Text style={[styles.tutorialLocationBadgeText, { color: theme.green }]}>📍 HUB INFERIOR › 💳 RESUMEN</Text>
                </View>
                <Text style={{ fontSize: 40, textAlign: 'center', marginVertical: 6 }}>💳</Text>
                <Text style={[styles.tutorialStepTitle, { color: theme.text }]}>1. Resumen: Saldo Libre, Sobres y Metas</Text>
                <Text style={[styles.tutorialStepDesc, { color: theme.muted }]}>
                  En la pestaña principal ves tu balance en tiempo real, tus metas de ahorro y tus sobres presupuestales. Toca el ojo <Text style={{ fontWeight: '800', color: theme.text }}>👁️</Text> en cualquier bloque para ocultar o mostrar cifras de forma independiente.
                </Text>
                <View style={[styles.tutorialTipBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <Text style={{ fontSize: 12, color: theme.green, fontWeight: '800' }}>🔒 Privacidad Granular</Text>
                  <Text style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>
                    Oculta tu saldo en transporte público o la oficina sin esconder tus gastos diarios. Cada sección tiene su propio botón de privacidad.
                  </Text>
                </View>
              </View>
            )}

            {tutorialStep === 1 && (
              <View style={styles.tutorialStepContent}>
                <View style={[styles.tutorialLocationBadge, { backgroundColor: theme.cardSubtle }]}>
                  <Text style={[styles.tutorialLocationBadgeText, { color: theme.green }]}>📍 BOTÓN FLOTANTE › ⚡ RAYO RÁPIDO</Text>
                </View>
                <Text style={{ fontSize: 40, textAlign: 'center', marginVertical: 6 }}>⚡</Text>
                <Text style={[styles.tutorialStepTitle, { color: theme.text }]}>2. Registro a 1 Clic (Teclado Táctil)</Text>
                <Text style={[styles.tutorialStepDesc, { color: theme.muted }]}>
                  Toca el botón flotante verde <Text style={{ fontWeight: '800', color: theme.green }}>⚡</Text> siempre a mano para abrir el teclado numérico de fricción cero. Ingresa el monto y categoría en solo 3 segundos sin lidiar con teclados incómodos.
                </Text>
                <View style={[styles.tutorialTipBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <Text style={{ fontSize: 12, color: theme.green, fontWeight: '800' }}>💡 Atajos Rápidos</Text>
                  <Text style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>
                    Usa los chips de +5k, +10k, +50k para sumar cifras al instante y agilizar tu registro diario.
                  </Text>
                </View>
              </View>
            )}

            {tutorialStep === 2 && (
              <View style={styles.tutorialStepContent}>
                <View style={[styles.tutorialLocationBadge, { backgroundColor: theme.cardSubtle }]}>
                  <Text style={[styles.tutorialLocationBadgeText, { color: theme.green }]}>📍 LISTA DE MOVIMIENTOS › ✅ PAGADAS</Text>
                </View>
                <Text style={{ fontSize: 40, textAlign: 'center', marginVertical: 6 }}>✅</Text>
                <Text style={[styles.tutorialStepTitle, { color: theme.text }]}>3. Cero Ruido Visual: Pendientes vs Pagadas</Text>
                <Text style={[styles.tutorialStepDesc, { color: theme.muted }]}>
                  Tus compromisos pendientes viven en la lista principal. Al tocar el círculo para marcar una factura como pagada, <Text style={{ fontWeight: '800', color: theme.green }}>se traslada de inmediato</Text> a la sección colapsable "Facturas y Gastos Pagados".
                </Text>
                <View style={[styles.tutorialTipBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <Text style={{ fontSize: 12, color: theme.green, fontWeight: '800' }}>✨ Pantalla Despejada</Text>
                  <Text style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>
                    Evita la ansiedad financiera manteniendo a la vista únicamente lo que te falta por pagar este mes.
                  </Text>
                </View>
              </View>
            )}

            {tutorialStep === 3 && (
              <View style={styles.tutorialStepContent}>
                <View style={[styles.tutorialLocationBadge, { backgroundColor: theme.cardSubtle }]}>
                  <Text style={[styles.tutorialLocationBadgeText, { color: theme.green }]}>📍 HUB INFERIOR › ⚡ OPCIONES PRO</Text>
                </View>
                <Text style={{ fontSize: 40, textAlign: 'center', marginVertical: 6 }}>🔮</Text>
                <Text style={[styles.tutorialStepTitle, { color: theme.text }]}>4. Inteligencia Financiera y Automatización</Text>
                <Text style={[styles.tutorialStepDesc, { color: theme.muted }]}>
                  En la pestaña <Text style={{ fontWeight: '800', color: theme.text }}>Opciones PRO</Text> accedes a tus 4 herramientas de alta potencia:
                  {'\n'}• <Text style={{ fontWeight: '700' }}>Proyección a fin de mes</Text> con tu ritmo de gasto actual.
                  {'\n'}• <Text style={{ fontWeight: '700' }}>Suscripciones recurrentes</Text> (Netflix, Gym, etc.).
                  {'\n'}• <Text style={{ fontWeight: '700' }}>Simulador de deudas</Text> y amortización acelerada.
                  {'\n'}• <Text style={{ fontWeight: '700' }}>Escáner Bancario</Text> con detección de SMS y copiado en 1 toque.
                </Text>
                <View style={[styles.tutorialTipBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <Text style={{ fontSize: 12, color: theme.green, fontWeight: '800' }}>🔒 Estándar Bancario</Text>
                  <Text style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>
                    Tus números de tarjeta se enmascaran automáticamente bajo estándar PCI-DSS para máxima seguridad.
                  </Text>
                </View>
              </View>
            )}

            {tutorialStep === 4 && (
              <View style={styles.tutorialStepContent}>
                <View style={[styles.tutorialLocationBadge, { backgroundColor: theme.cardSubtle }]}>
                  <Text style={[styles.tutorialLocationBadgeText, { color: theme.green }]}>📍 HUB INFERIOR › 👤 MI CUENTA</Text>
                </View>
                <Text style={{ fontSize: 40, textAlign: 'center', marginVertical: 6 }}>👤</Text>
                <Text style={[styles.tutorialStepTitle, { color: theme.text }]}>5. Tu Cuenta, Respaldo y Ajustes</Text>
                <Text style={[styles.tutorialStepDesc, { color: theme.muted }]}>
                  En <Text style={{ fontWeight: '800', color: theme.text }}>Mi Cuenta</Text> configuras tu sueldo base mensual, exportas tus reportes a Excel con fórmulas, cambias entre modo claro/oscuro, y sincronizas tus datos con tu correo para acceder en cualquier dispositivo.
                </Text>
                <View style={[styles.tutorialTipBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <Text style={{ fontSize: 12, color: theme.green, fontWeight: '800' }}>✨ Vuelve a ver el tour</Text>
                  <Text style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>
                    Toca "Repetir Tutorial" en Mi Cuenta o el ícono ✨ en la barra superior cuando desees refrescar el uso de la app.
                  </Text>
                </View>
              </View>
            )}

            {/* Indicadores de Puntos (Dots) */}
            <View style={styles.dotsRow}>
              {[0, 1, 2, 3, 4].map(step => (
                <View
                  key={step}
                  style={[
                    styles.dotItem,
                    { backgroundColor: step === tutorialStep ? theme.green : theme.cardSubtle },
                    step === tutorialStep && { width: 22 }
                  ]}
                />
              ))}
            </View>

            {/* Botones de Navegación del Wizard */}
            <View style={styles.wizardButtonsRow}>
              {tutorialStep > 0 ? (
                <TouchableOpacity
                  style={[styles.btnCancel, { borderColor: theme.border, paddingHorizontal: 16 }]}
                  onPress={() => setTutorialStep(prev => prev - 1)}
                >
                  <Text style={{ color: theme.muted, fontWeight: '700' }}>‹ Anterior</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ width: 1 }} />
              )}

              {tutorialStep < 4 ? (
                <TouchableOpacity
                  style={[styles.btnSaveTx, { backgroundColor: theme.accent, paddingHorizontal: 22 }]}
                  onPress={() => setTutorialStep(prev => prev + 1)}
                >
                  <Text style={{ color: theme.accentText, fontWeight: '800' }}>Siguiente ›</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.btnSaveTx, { backgroundColor: theme.green, paddingHorizontal: 24 }]}
                  onPress={async () => {
                    setShowTutorialModal(false);
                    await setFirstLaunchCompleted();
                  }}
                >
                  <Text style={{ color: '#FFF', fontWeight: '800' }}>¡Comenzar Ahora! 🚀</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 8: DIÁLOGO DE CONFIRMACIÓN UNIVERSAL (100% WEB & MOBILE) */}
      <Modal visible={confirmModal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border, maxWidth: 380 }]}>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <View style={[styles.confirmIconCircle, { backgroundColor: theme.redSoft }]}>
                <Text style={{ fontSize: 24 }}>⚠️</Text>
              </View>
            </View>
            <Text style={[styles.modalTitle, { color: theme.text, textAlign: 'center', marginBottom: 8 }]}>
              {confirmModal.title}
            </Text>
            <Text style={{ fontSize: 13, color: theme.muted, textAlign: 'center', lineHeight: 18, marginBottom: 20 }}>
              {confirmModal.message}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[styles.btnCancel, { flex: 1, borderColor: theme.border, alignItems: 'center' }]}
                onPress={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
              >
                <Text style={{ color: theme.muted, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnSaveTx, { flex: 1, backgroundColor: theme.red, alignItems: 'center' }]}
                onPress={() => {
                  const action = confirmModal.onConfirm;
                  setConfirmModal(prev => ({ ...prev, visible: false }));
                  action();
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '800' }}>{confirmModal.confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* BOTÓN FLOTANTE (FAB) ACCESIBLE SIEMPRE EXCEPTO EN PESTAÑA MI CUENTA */}
      {hubTab !== 'cuenta' && (
        <TouchableOpacity
          style={[
            styles.floatingFabBtn,
            isDesktop ? { bottom: 28 } : { bottom: 84 },
            fabPosition === 'izquierda' ? { left: 20, right: undefined } :
            fabPosition === 'centro' ? { left: '50%', right: undefined, transform: [{ translateX: -27 }] } :
            { right: 20, left: undefined },
            { backgroundColor: '#F6AC13' },
            theme.shadow
          ]}
          onPress={() => {
            setNumpadAmount('0');
            setNumpadDesc('');
            setNumpadCat('Supermercado');
            setShowNumpadModal(true);
          }}
          onLongPress={handleCycleFabPosition}
          activeOpacity={0.85}
          accessibilityLabel="Registro Rápido de Gasto"
        >
          <Text style={styles.floatingFabIcon}>⚡</Text>
        </TouchableOpacity>
      )}

      {/* FASE 1 MODAL: REGISTRO A UN CLIC CON NUMPAD TÁCTIL */}
      <Modal visible={showNumpadModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border, maxWidth: 440, padding: 18 }]}>
            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 18 }}>⚡</Text>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Registro Ultra Rápido</Text>
              </View>
              <TouchableOpacity onPress={() => setShowNumpadModal(false)}>
                <Text style={{ fontSize: 18, color: theme.muted, padding: 4 }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Display de Monto Gigante */}
            <View style={[styles.numpadDisplayBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              <Text style={[styles.numpadAmountDisplay, { color: numpadTipo === 'Ingreso' ? theme.green : theme.text }]}>
                {numpadTipo === 'Ingreso' ? '+' : ''}{formatCOP(Number(numpadAmount) || 0)}
              </Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                <TouchableOpacity
                  style={[styles.numpadTipoBadge, numpadTipo === 'Egreso' && { backgroundColor: theme.redSoft }]}
                  onPress={() => setNumpadTipo('Egreso')}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: numpadTipo === 'Egreso' ? theme.red : theme.muted }}>
                    💸 Gasto
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.numpadTipoBadge, numpadTipo === 'Ingreso' && { backgroundColor: theme.greenSoft }]}
                  onPress={() => setNumpadTipo('Ingreso')}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: numpadTipo === 'Ingreso' ? theme.green : theme.muted }}>
                    💰 Ingreso
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Selector de Categoría en Cuadrícula Deslizable */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginVertical: 8 }}>
              {CATEGORIAS_VISUALES.map((cv, i) => {
                const isSelected = String(numpadCat || '').toLowerCase() === cv.nombre.toLowerCase();
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.numpadCatChip,
                      { backgroundColor: isSelected ? theme.accent : theme.bg, borderColor: isSelected ? theme.green : theme.border }
                    ]}
                    onPress={() => setNumpadCat(cv.nombre)}
                  >
                    <Text style={{ fontSize: 14 }}>{cv.emoji}</Text>
                    <Text style={{ fontSize: 11, fontWeight: isSelected ? '800' : '600', color: isSelected ? theme.accentText : theme.text }}>
                      {cv.nombre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Atajos de Suma Rápida (COP) */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
              {[10000, 50000, 100000].map(val => (
                <TouchableOpacity
                  key={val}
                  style={[styles.numpadQuickChip, { backgroundColor: theme.cardSubtle, borderColor: theme.border }]}
                  onPress={() => handleNumpadQuickAdd(val)}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: theme.green }}>
                    +${val / 1000}k
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Teclado Numérico Numpad Táctil */}
            <View style={styles.numpadGrid}>
              {[
                ['1', '2', '3'],
                ['4', '5', '6'],
                ['7', '8', '9'],
                ['C', '0', '⌫']
              ].map((row, rIdx) => (
                <View key={rIdx} style={styles.numpadRow}>
                  {row.map(k => (
                    <TouchableOpacity
                      key={k}
                      style={[
                        styles.numpadKey,
                        { backgroundColor: k === 'C' || k === '⌫' ? theme.cardSubtle : theme.bg, borderColor: theme.border }
                      ]}
                      onPress={() => {
                        if (k === 'C') handleNumpadClear();
                        else if (k === '⌫') handleNumpadBackspace();
                        else handleNumpadDigit(k);
                      }}
                      activeOpacity={0.6}
                    >
                      <Text style={[styles.numpadKeyText, { color: k === 'C' ? theme.red : theme.text }]}>
                        {k}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>

            {/* Nota Opcional */}
            <TextInput
              style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text, fontSize: 12, paddingVertical: 8, marginTop: 8 }]}
              placeholder={`Nota opcional (Por defecto: ${numpadCat})`}
              placeholderTextColor={theme.muted}
              value={numpadDesc}
              onChangeText={setNumpadDesc}
            />

            {/* Botón Guardar */}
            <TouchableOpacity
              style={[styles.btnSaveTx, { backgroundColor: theme.green, alignItems: 'center', marginTop: 10, paddingVertical: 13 }]}
              onPress={handleSaveNumpadTransaction}
            >
              <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '900' }}>
                ✓ Guardar {formatCOP(Number(numpadAmount) || 0)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* FASE 3 MODAL: FIJAR PRESUPUESTO POR CATEGORÍA (SOBRES) */}
      <Modal visible={showPresupuestoModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingBudgetIndex !== null ? '✏️ Modificar Sobre de Presupuesto' : '✉️ Nuevo Sobre de Presupuesto'}
              </Text>
              <TouchableOpacity onPress={() => setShowPresupuestoModal(false)}>
                <Text style={{ fontSize: 18, color: theme.muted, padding: 4 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 12, color: theme.muted, marginBottom: 10 }}>
              {editingBudgetIndex !== null
                ? 'Modifica el nombre de la sección o su tope mensual de gasto.'
                : 'Fija un límite mensual para controlar tus gastos y recibir alertas de color automáticas.'}
            </Text>

            <Text style={[styles.fieldLabel, { color: theme.muted }]}>Nombre de la Categoría o Sección</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
              value={budgetCat}
              onChangeText={setBudgetCat}
              placeholder="Ej. Supermercado, D1, Salidas, Gasolina..."
              placeholderTextColor={theme.muted}
            />

            <Text style={[styles.fieldLabel, { color: theme.muted, marginTop: 4 }]}>Sugerencias Rápidas</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginVertical: 4 }}>
              {CATEGORIAS_VISUALES.filter(c => c.nombre !== 'Ingreso Sueldo').map((cv, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.numpadCatChip,
                    {
                      backgroundColor: String(budgetCat || '').toLowerCase() === cv.nombre.toLowerCase() ? theme.accent : theme.bg,
                      borderColor: String(budgetCat || '').toLowerCase() === cv.nombre.toLowerCase() ? theme.green : theme.border
                    }
                  ]}
                  onPress={() => setBudgetCat(cv.nombre)}
                >
                  <Text style={{ fontSize: 14 }}>{cv.emoji}</Text>
                  <Text style={{ fontSize: 11, fontWeight: String(budgetCat || '').toLowerCase() === cv.nombre.toLowerCase() ? '800' : '600', color: String(budgetCat || '').toLowerCase() === cv.nombre.toLowerCase() ? theme.accentText : theme.text }}>
                    {cv.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: theme.muted, marginTop: 6 }]}>Tope Mensual Máximo (COP)</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
              value={budgetAmount}
              onChangeText={setBudgetAmount}
              keyboardType="numeric"
              placeholder="Ej. 400000"
              placeholderTextColor={theme.muted}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={[styles.btnCancel, { borderColor: theme.border }]} onPress={() => setShowPresupuestoModal(false)}>
                <Text style={{ color: theme.muted, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnSaveTx, { backgroundColor: theme.green }]} onPress={handleSavePresupuesto}>
                <Text style={{ color: '#FFF', fontWeight: '800' }}>
                  {editingBudgetIndex !== null ? 'Guardar Cambios' : 'Guardar Sobre'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* FASE 2 MODAL: NUEVA SUSCRIPCIÓN */}
      <Modal visible={showSubModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>🔄 Nueva Suscripción</Text>
              <TouchableOpacity onPress={() => setShowSubModal(false)}>
                <Text style={{ fontSize: 18, color: theme.muted, padding: 4 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { color: theme.muted }]}>Nombre del Servicio</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
              value={newSubNombre}
              onChangeText={setNewSubNombre}
              placeholder="Ej. Netflix, Spotify, iCloud, Gimnasio..."
              placeholderTextColor={theme.muted}
            />

            <Text style={[styles.fieldLabel, { color: theme.muted }]}>Costo Mensual (COP)</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
              value={newSubMonto}
              onChangeText={setNewSubMonto}
              keyboardType="numeric"
              placeholder="Ej. 26900"
              placeholderTextColor={theme.muted}
            />

            <Text style={[styles.fieldLabel, { color: theme.muted }]}>Día de Cobro Mensual (1 al 31)</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
              value={newSubDia}
              onChangeText={setNewSubDia}
              keyboardType="numeric"
              placeholder="15"
              placeholderTextColor={theme.muted}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={[styles.btnCancel, { borderColor: theme.border }]} onPress={() => setShowSubModal(false)}>
                <Text style={{ color: theme.muted, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnSaveTx, { backgroundColor: theme.green }]} onPress={handleCreateSuscripcion}>
                <Text style={{ color: '#FFF', fontWeight: '800' }}>Guardar Suscripción</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* FASE 5 MODAL: NUEVA DEUDA O TARJETA */}
      <Modal visible={showDeudaModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingDeudaId ? '✏️ Editar Deuda o Crédito' : '💳 Registrar Deuda o Tarjeta'}
              </Text>
              <TouchableOpacity onPress={() => setShowDeudaModal(false)}>
                <Text style={{ fontSize: 18, color: theme.muted, padding: 4 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { color: theme.muted }]}>Nombre de la Deuda</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
              value={newDeudaNombre}
              onChangeText={setNewDeudaNombre}
              placeholder="Ej. Tarjeta Bancolombia, Crédito Libre Inversión..."
              placeholderTextColor={theme.muted}
            />

            <Text style={[styles.fieldLabel, { color: theme.muted }]}>Saldo Total Adeudado (COP)</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
              value={newDeudaSaldo}
              onChangeText={setNewDeudaSaldo}
              keyboardType="numeric"
              placeholder="Ej. 1500000"
              placeholderTextColor={theme.muted}
            />

            {/* Plazo del Crédito en Meses */}
            <Text style={[styles.fieldLabel, { color: theme.muted }]}>Plazo del Crédito (Meses)</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
              {['6', '12', '24', '36', '48', '60'].map(term => (
                <TouchableOpacity
                  key={term}
                  style={[
                    styles.debtTermChip,
                    {
                      backgroundColor: newDeudaPlazo === term ? theme.accent : theme.bg,
                      borderColor: newDeudaPlazo === term ? theme.green : theme.border
                    }
                  ]}
                  onPress={() => setNewDeudaPlazo(term)}
                >
                  <Text style={{ fontSize: 11, fontWeight: newDeudaPlazo === term ? '800' : '600', color: newDeudaPlazo === term ? theme.accentText : theme.text }}>
                    {term}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text, marginTop: 2 }]}
              value={newDeudaPlazo}
              onChangeText={setNewDeudaPlazo}
              keyboardType="numeric"
              placeholder="Plazo en meses (ej. 12)"
              placeholderTextColor={theme.muted}
            />

            <Text style={[styles.fieldLabel, { color: theme.muted }]}>
              Cuota Mensual (COP) - <Text style={{ fontSize: 10, fontWeight: '400' }}>Opcional: auto-calculada si se deja vacía</Text>
            </Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
              value={newDeudaCuota}
              onChangeText={setNewDeudaCuota}
              keyboardType="numeric"
              placeholder="Ej. 120000 (o déjalo vacío para calcular)"
              placeholderTextColor={theme.muted}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: theme.muted }]}>Tasa Anual E.A. (%)</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
                  value={newDeudaTasa}
                  onChangeText={setNewDeudaTasa}
                  keyboardType="numeric"
                  placeholder="28"
                  placeholderTextColor={theme.muted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: theme.muted }]}>Día de Corte</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
                  value={newDeudaDia}
                  onChangeText={setNewDeudaDia}
                  keyboardType="numeric"
                  placeholder="17"
                  placeholderTextColor={theme.muted}
                />
              </View>
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={[styles.btnCancel, { borderColor: theme.border }]} onPress={() => setShowDeudaModal(false)}>
                <Text style={{ color: theme.muted, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnSaveTx, { backgroundColor: theme.green }]} onPress={handleCreateDeuda}>
                <Text style={{ color: '#FFF', fontWeight: '800' }}>
                  {editingDeudaId ? 'Guardar Cambios' : 'Guardar Deuda'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topbar: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
  topbarMainRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  logoTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogoImage: {
    width: 175,
    height: 44,
  },
  brandLogoImageMobile: {
    width: 130,
    height: 34,
  },
  asesoriaBtn: {
    backgroundColor: '#FFD64F',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F6AC13',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  asesoriaBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#212224',
    letterSpacing: 0.2,
  },
  brandPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  brandTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
  topbarIconsRow: { flexDirection: 'row', gap: 8 },
  iconButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  iconButtonText: { fontSize: 16 },

  // Responsive Desktop Tabs & Bento Grid
  desktopNavTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  desktopNavTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
  },
  desktopNavTabText: {
    fontSize: 13,
  },
  desktopBentoContainer: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
    width: '100%',
  },
  desktopMainColumn: {
    flex: 1.35,
    minWidth: 0,
  },
  desktopSideColumn: {
    flex: 0.95,
    minWidth: 0,
    gap: 16,
  },
  desktopTabWrapper: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },

  // Month Navigator
  monthNavigatorCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  monthNavArrow: { paddingHorizontal: 10, paddingVertical: 4 },
  monthNavArrowText: { fontSize: 24, fontWeight: '700', lineHeight: 24 },
  monthTitleWrapper: { alignItems: 'center', flex: 1, marginHorizontal: 4 },
  monthActiveText: { fontSize: 15, fontWeight: '900', textTransform: 'capitalize' },
  monthPickerSub: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  btnNewMonthHeader: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, flexShrink: 0 },
  btnNewMonthHeaderText: { fontSize: 11, fontWeight: '800' },

  // Calendario Interactivo
  calendarCard: { marginTop: 10, borderRadius: 22, padding: 14, borderWidth: 1, width: '100%' },
  calendarHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  calendarTitle: { fontSize: 14, fontWeight: '800' },
  btnClearDayFilter: { paddingHorizontal: 8, paddingVertical: 4 },
  calendarWeekdaysRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 6 },
  calendarWeekdayText: { fontSize: 11, fontWeight: '700', textAlign: 'center', width: '13%' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', rowGap: 6 },
  calendarDayCellEmpty: { width: '14.28%', height: 38 },
  calendarDayCell: { width: '14.28%', height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1 },
  calendarDayNum: { fontSize: 12 },
  calendarDotsRow: { flexDirection: 'row', gap: 3, marginTop: 2, height: 4 },
  calendarDot: { width: 4, height: 4, borderRadius: 2 },
  calendarFooterRow: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderColor: 'rgba(128,128,128,0.15)', flexDirection: 'row', alignItems: 'center' },
  btnAddDayTx: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },

  // Content
  scrollContent: { paddingHorizontal: 16, paddingBottom: 120 },

  // Hero Card Obsidian Fluid
  heroCard: {
    borderRadius: 32,
    padding: 22,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative'
  },
  heroBadgeRow: { marginBottom: 10, width: '100%' },
  heroStatusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  heroStatusBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  heroPrivacyBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  heroAmount: { fontSize: 42, fontWeight: '900', letterSpacing: -1.2, marginVertical: 8, textAlign: 'center' },
  heroFreeMoneyPill: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 14
  },
  heroMicroGrid: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 14
  },
  heroMicroCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center'
  },
  heroMicroLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4
  },
  heroMicroValue: {
    fontSize: 14,
    fontWeight: '900'
  },
  heroProToggle: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%'
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16
  },
  quickActionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 64
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '800'
  },
  heroSub: { fontSize: 13, fontWeight: '500', marginBottom: 16, textAlign: 'center' },

  statCardsRow: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 14 },
  statBox: { flex: 1, padding: 14, borderRadius: 20, borderWidth: 1 },
  statBoxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statBoxAmount: { fontSize: 18, fontWeight: '900', marginTop: 8 },
  statBoxSub: { fontSize: 11, marginTop: 4, lineHeight: 15 },

  progressBarContainer: { width: '100%', padding: 14, borderRadius: 20, borderWidth: 1 },
  progressInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressTitle: { fontSize: 12, fontWeight: '700' },
  progressValues: { fontSize: 12, fontWeight: '800' },
  progressTrack: { height: 9, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99 },

  // Cloud Banner (Híbrido)
  cloudBannerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 22, borderWidth: 1, marginBottom: 16 },
  badgeFree: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  btnCloudLogin: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  btnCloudLoginText: { fontSize: 12, fontWeight: '800' },
  cloudConnectedCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 16 },

  // Full Width Section Card
  sectionCard: { borderRadius: 28, padding: 20, borderWidth: 1, marginBottom: 16 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionHeading: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  sectionSubHeading: { fontSize: 12, marginTop: 2 },
  totalGoalsBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, flexShrink: 0 },
  totalGoalsText: { fontSize: 14, fontWeight: '900' },

  goalsList: { gap: 10 },
  goalCardItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 20, borderWidth: 1 },
  goalCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 8 },
  goalEmoji: { fontSize: 24 },
  goalName: { fontSize: 14, fontWeight: '800' },
  goalSub: { fontSize: 11, marginTop: 2 },
  goalCardRight: { alignItems: 'flex-end', gap: 2, flexShrink: 0 },
  goalAmount: { fontSize: 15, fontWeight: '900' },
  btnAddGoal: { paddingVertical: 13, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', marginTop: 6 },
  btnAddGoalText: { fontSize: 13, fontWeight: '800' },

  categoryBreakdownList: { gap: 12 },
  categoryItemRow: { width: '100%' },
  categoryTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  categoryName: { fontSize: 13, fontWeight: '700' },
  categoryNumbers: { fontSize: 13, fontWeight: '800' },
  categoryTrack: { height: 8, borderRadius: 99, overflow: 'hidden' },
  categoryBarFill: { height: '100%', borderRadius: 99 },

  // Transactions Section
  txSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  btnAddTxSmall: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, flexShrink: 0 },
  btnAddTxSmallText: { color: '#FFF', fontSize: 12, fontWeight: '800' },

  rangeFilterRow: { flexDirection: 'row', gap: 6 },
  rangeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  rangeChipText: { fontSize: 11, fontWeight: '700' },
  dayActiveBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 10 },

  searchInput: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, borderWidth: 1, fontSize: 13, marginBottom: 12 },
  filterStatusRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterStatusBtn: { flex: 1, paddingVertical: 10, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(128,128,128,0.15)' },
  filterStatusText: { fontSize: 11, fontWeight: '700' },

  chipsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '700' },

  txList: { gap: 10 },
  txItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20, borderWidth: 1, gap: 12 },
  txItemPaid: { opacity: 0.65 },
  checkbox: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  txEmojiBox: { width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(128,128,128,0.12)', alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1, paddingRight: 6 },
  txTitle: { fontSize: 14, fontWeight: '800' },
  txTitlePaid: { textDecorationLine: 'line-through' },
  txSub: { fontSize: 11 },
  txRight: { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  txAmount: { fontSize: 16, fontWeight: '900' },

  emptyStateCard: { padding: 32, borderRadius: 24, borderWidth: 1, alignItems: 'center' },

  // Scanner Tab
  privacyBox: { padding: 12, borderRadius: 14, borderWidth: 1, marginVertical: 12 },
  btnClipboardMagic: { paddingVertical: 15, borderRadius: 18, alignItems: 'center', marginBottom: 10 },
  btnClipboardMagicText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  sampleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  sampleBtn: { flexBasis: '48%', flexGrow: 1, padding: 10, borderRadius: 14, borderWidth: 1 },
  scannerInput: { borderWidth: 1, borderRadius: 16, padding: 14, fontSize: 13, minHeight: 80, textAlignVertical: 'top', marginBottom: 10 },
  btnAnalyze: { paddingVertical: 12, borderRadius: 14, alignItems: 'center', borderWidth: 1 },
  btnClearDetected: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  detectedCard: { padding: 16, borderRadius: 22, borderWidth: 1, marginBottom: 12 },
  bankBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  detectedActionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: 'rgba(128,128,128,0.15)', paddingTop: 12, marginTop: 4, flexWrap: 'wrap', gap: 8 },
  btnDiscardDetected: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  btnImport: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },

  // Compare Tab
  compareRowCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1 },

  // Bottom Floating Dock (100% RESPONSIVE)
  floatingDock: {
    position: 'absolute',
    bottom: 20,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 26,
    borderWidth: 1,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10
  },
  dockTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 20,
    minHeight: 50
  },
  dockTabIcon: {
    fontSize: 18,
    marginBottom: 2
  },
  dockTabText: {
    fontSize: 11,
    fontWeight: '700'
  },
  dockActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3
  },
  dockAddBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 18
  },
  dockAddBtnIcon: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '900',
    lineHeight: 18,
    marginBottom: 2
  },
  dockAddBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF'
  },

  // Modales
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 440, padding: 22, borderRadius: 28, borderWidth: 1 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 19, fontWeight: '900' },
  segmentRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  segmentBtn: { flex: 1, paddingVertical: 11, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(128,128,128,0.2)' },
  fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 5, marginTop: 10 },
  inputField: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14 },
  quickCatChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, marginRight: 6 },
  catVisualGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  catVisualBtn: { width: '31%', minHeight: 52, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', gap: 3 },
  catVisualEmoji: { fontSize: 22 },
  catVisualText: { fontSize: 10, textAlign: 'center' },
  modalActionsRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 22 },
  btnCancel: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 14, borderWidth: 1 },
  btnSaveTx: { paddingHorizontal: 20, paddingVertical: 11, borderRadius: 14 },
  btnDeleteTx: { marginRight: 'auto', paddingHorizontal: 14, paddingVertical: 11, borderRadius: 14, borderWidth: 1 },
  monthOption: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 8 },

  // User Profile & Auth Modal
  userAvatarCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  btnManageProfile: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  profileHeaderCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 20, borderWidth: 1, marginBottom: 14 },
  bigAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  bigAvatarText: { fontSize: 24, fontWeight: '900' },
  profileName: { fontSize: 16, fontWeight: '900' },
  profileEmail: { fontSize: 12, marginTop: 2 },
  profileBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  activeStatusDot: { width: 7, height: 7, borderRadius: 3.5 },
  activeStatusText: { fontSize: 11, fontWeight: '800' },
  syncExplainBox: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 14, alignItems: 'center' },
  btnSyncNow: { paddingVertical: 13, borderRadius: 14, alignItems: 'center' },
  cloudStatusBox: { padding: 14, borderRadius: 16, borderWidth: 1 },

  // Tutorial Wizard Step-by-Step
  stepBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  stepBadgeText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  tutorialStepContent: { marginVertical: 8, alignItems: 'center' },
  tutorialStepTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  tutorialStepDesc: { fontSize: 13, textAlign: 'center', lineHeight: 19, marginBottom: 14 },
  tutorialTipBox: { width: '100%', padding: 12, borderRadius: 14, borderWidth: 1, marginTop: 4 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginVertical: 18 },
  dotItem: { width: 8, height: 8, borderRadius: 4 },
  wizardButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  // Diálogo de Confirmación Universal
  confirmIconCircle: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },

  // Tarjeta de Inicio en $0
  emptyStarterCard: { padding: 26, borderRadius: 24, borderWidth: 1, alignItems: 'center', marginBottom: 16 },
  emptyStarterTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 6 },
  emptyStarterSub: { fontSize: 13, textAlign: 'center', lineHeight: 18, marginBottom: 18 },
  emptyStarterActionsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  btnSetupStarter: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 14 },
  btnAddStarter: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 14 },

  // Tutorial Card
  tutorialCard: { padding: 14, borderRadius: 16, borderWidth: 1 },
  tutorialCardTitle: { fontSize: 13, fontWeight: '800', marginBottom: 4 },
  tutorialCardBody: { fontSize: 12, lineHeight: 18 },

  // Proyección & Burn-Rate
  burnRateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1, marginTop: 10 },
  burnRateCol: { flex: 1, alignItems: 'center' },
  burnRateAmount: { fontSize: 13, fontWeight: '800', marginTop: 3 },

  // Presupuestos por Categoría (Sobres)
  budgetEnvelopeCard: { padding: 12, borderRadius: 16, borderWidth: 1 },

  // Suscripciones Recurrentes
  subsSummaryBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 8, flexWrap: 'wrap', gap: 8 },
  btnImportSubs: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  subCardItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1 },

  // Inteligencia de Deuda & Amortización
  debtSimCard: { padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 8 },
  debtResultPill: { padding: 12, borderRadius: 14, marginTop: 6 },

  // Botón Flotante de Acción Rápida (FAB)
  floatingFabBtn: { position: 'absolute', right: 20, bottom: 84, width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', elevation: 12, zIndex: 999 },
  floatingFabIcon: { fontSize: 24, color: '#1B2432', fontWeight: '900' },

  // Teclado Numérico Fricción-Cero (Numpad Modal)
  numpadDisplayBox: { padding: 16, borderRadius: 18, alignItems: 'center', marginVertical: 8, borderWidth: 1 },
  numpadAmountDisplay: { fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  numpadTipoBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  numpadCatChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  numpadQuickChip: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  numpadGrid: { gap: 8, marginVertical: 8 },
  numpadRow: { flexDirection: 'row', gap: 8 },
  numpadKey: { flex: 1, height: 50, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  numpadKeyText: { fontSize: 20, fontWeight: '800' },

  // Hub Header Banner & Badges
  hubHeaderBanner: { padding: 18, borderRadius: 24, borderWidth: 1, marginBottom: 14 },
  hubHeaderTitle: { fontSize: 18, fontWeight: '900' },
  hubHeaderSub: { fontSize: 12, lineHeight: 17, marginTop: 2 },

  // Facturas y Gastos Pagados (Separación sin ruido visual)
  pagadasContainerCard: { padding: 14, borderRadius: 20, borderWidth: 1, marginTop: 14, marginBottom: 10 },
  pagadasHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pagadasCountBadge: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  pagadasSectionTitle: { fontSize: 14, fontWeight: '900' },
  pagadasExpandedList: { marginTop: 12, gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.15)' },
  pagadaItemRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1, gap: 10 },
  allPaidCelebrationCard: { padding: 20, borderRadius: 20, borderWidth: 1, alignItems: 'center', marginVertical: 10 },

  // Opciones de Cuenta, Historial y Preferencias
  cuentaOptionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 16, borderWidth: 1 },
  themePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  privacyToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, borderWidth: 1 },

  // Tutorial interactivo dinámico con insignias de ubicación
  tutorialLocationBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 8 },
  tutorialLocationBadgeText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

  // Huevo de Pascua Temático Mensual
  seasonalPill: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  // Inteligencia de Deudas Alineada
  debtStrategyCard: { padding: 14, borderRadius: 18, borderWidth: 1 },
  strategyRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  strategyRadioDot: { width: 12, height: 12, borderRadius: 6 },

  // Escáner bancario con un solo ejemplo genérico
  sampleBtnSingle: { padding: 14, borderRadius: 16, borderWidth: 1 },

  // Botón Ajustar Ciclo en Proyección
  btnModifyCycle: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },

  // Personalización de Avatar & Emoticon
  avatarEmojiChip: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarGridItem: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },

  // Selector de Posición del FAB
  fabPosChip: { flex: 1, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },

  // Selector de Plazo de Deuda en Meses
  debtTermChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }
});
