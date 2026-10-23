export type TipoMovimiento = 'Ingreso' | 'Egreso';

export type CategoriaMovimiento =
  | 'Gastos opcionales'
  | 'Gastos fijos'
  | 'Servicios'
  | 'Deudas'
  | 'Ahorro'
  | 'Ingreso Sueldo'
  | 'Ingreso Adicional'
  | string;

export interface Movimiento {
  id: string;
  tipo: TipoMovimiento;
  categoria: CategoriaMovimiento;
  descripcion: string;
  monto: number;
  pagado: boolean;
  fecha?: string;
  medio?: string;
}

export interface MetaAhorro {
  id: string;
  nombre: string;
  acumulado: number;
}

export interface MesFinanciero {
  id: string;
  nombre: string; // ej. "Octubre 2026"
  titulo: string;
  sueldoBase: number;
  cicloDiaInicio?: number; // Día del 1 al 31 donde inicia el ciclo de corte
  cicloFrecuencia?: 'mensual' | 'quincenal';
  ingresoRecurrente?: boolean;
  metas: MetaAhorro[];
  movimientos: Movimiento[];
}

export interface MovimientoBancarioDetectado {
  id: string;
  entidad: string;
  tipo: TipoMovimiento;
  comercio: string;
  medio: string;
  monto: number;
  categoriaSugerida: CategoriaMovimiento;
  descripcionSugerida: string;
  fecha: string;
  imported: boolean;
}

export interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  password?: string;
  creadoEn: string;
  ultimaSincronizacion?: string;
  avatarEmoji?: string;
}

export interface Suscripcion {
  id: string;
  nombre: string;
  monto: number;
  categoria: string;
  diaCobro: number;
  emoji: string;
  activo: boolean;
}

export interface PresupuestoCategoria {
  categoria: string;
  limite: number;
}

export interface DeudaItem {
  id: string;
  nombre: string;
  saldoTotal: number;
  cuotaMinima: number;
  tasaInteresAnual: number; // Porcentaje anual (ej. 28)
  diaCorte: number;
  plazoMeses?: number; // Plazo del crédito en meses (ej. 12, 24, 36)
}

export type FabPosition = 'derecha' | 'izquierda' | 'centro';

export interface PrivacySectionsConfig {
  disponible: boolean;
  ingresos: boolean;
  compromisos: boolean;
  metas: boolean;
}


