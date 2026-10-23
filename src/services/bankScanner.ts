import { MovimientoBancarioDetectado, TipoMovimiento, CategoriaMovimiento } from '../types';

export function parseMonto(val: any): number {
  if (typeof val === 'number') return Math.max(0, Math.round(val));
  if (!val) return 0;
  let str = String(val).trim();
  str = str.replace(/[,.]\d{2}$/, '');
  const clean = str.replace(/[^0-9-]+/g, '');
  return Math.max(0, Number(clean) || 0);
}

export function maskCreditCardNumbers(text: string): string {
  // Enmascara números de tarjetas de 13 a 19 dígitos (PCI-DSS compliance)
  return text.replace(/\b(?:\d[ -]*?){13,19}\b/g, (match) => {
    const digits = match.replace(/\D/g, '');
    return `*${digits.slice(-4)}`;
  });
}

export function parseColombianNotification(text: string, source: string = ''): MovimientoBancarioDetectado | null {
  const maskedText = maskCreditCardNumbers(text);
  const clean = (source + ' ' + maskedText).replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ');
  const textLower = clean.toLowerCase();

  let entidad = 'Banco / Pasarela';
  if (textLower.includes('bancolombia')) entidad = 'Bancolombia';
  else if (textLower.includes('davivienda') || textLower.includes('daviplata')) entidad = 'Davivienda';
  else if (textLower.includes('nu.com') || textLower.includes('nubank') || textLower.includes('cuenta nu')) entidad = 'Nu Colombia';
  else if (textLower.includes('falabella')) entidad = 'Banco Falabella';
  else if (textLower.includes('lulo')) entidad = 'Lulo Bank';
  else if (textLower.includes('colpatria')) entidad = 'Scotiabank Colpatria';
  else if (textLower.includes('tuya')) entidad = 'Tarjeta Tuya';
  else if (textLower.includes('rappi')) entidad = 'RappiPay';
  else if (textLower.includes('nequi')) entidad = 'Nequi';
  else if (textLower.includes('dale')) entidad = 'Dale!';
  else if (textLower.includes('pse') || textLower.includes('ach')) entidad = 'PSE';
  else if (textLower.includes('jelpit')) entidad = 'Jelpit';
  else if (textLower.includes('avalpay')) entidad = 'AvalPay';
  else if (textLower.includes('epayco') || textLower.includes('wompi')) entidad = 'Pasarela Web';

  let tipo: TipoMovimiento = 'Egreso';
  let comercio = 'Movimiento Financiero';
  let medio = entidad;
  let monto = 0;

  const rxCompra = /Compraste\s+\$([0-9.,]+)\s+en\s+(.+?)\s+con\s+tu\s+([^\s,]+(?:\s+\*\d+)?)/i;
  const rxPago = /Pagaste\s+\$([0-9.,]+)\s+a\s+(.+?)\s+desde\s+tu\s+producto\s+\*?(\d+)/i;
  const rxTransf = /Transferiste\s+\$([0-9.,]+)\s+a\s+(.+?)\s+desde\s+tu\s+producto\s+\*?(\d+)/i;
  const rxRecibiste = /(?:Recibiste|Recibiras|Recibirás)\s+\$([0-9.,]+).*?(?:por parte de|de)\s+([^.]+?)(?:\.|\s+\d{2}:\d{2}|$)/i;
  const rxRetiro = /Retiraste\s+\$([0-9.,]+)\s+en\s+(.+?)\s+con/i;

  const rxNuCompra = /(?:Compra aprobada en|Compraste en)\s+([^.]+?)\s+por\s+\$([0-9.,]+)/i;
  const rxFalabella = /(?:Compra por|Compraste por)\s+\$([0-9.,]+)\s+(?:en|con tu)\s+([^.]+?)(?:\.|$)/i;
  const rxNequi = /(?:Enviaste|Pagaste)\s+\$([0-9.,]+)\s+a\s+([^.]+?)(?:\.|$)/i;
  const rxNequiRecibe = /(?:Te transfirieron|Te enviaron|Recibiste)\s+\$([0-9.,]+)\s+(?:de|por parte de)\s+([^.]+?)(?:\.|$)/i;

  let m: RegExpMatchArray | null;
  if ((m = clean.match(rxCompra))) {
    monto = parseMonto(m[1]);
    comercio = m[2].trim();
    medio = m[3].trim();
  } else if ((m = clean.match(rxNuCompra))) {
    monto = parseMonto(m[2]);
    comercio = m[1].trim();
    medio = 'Tarjeta Nu';
  } else if ((m = clean.match(rxFalabella))) {
    monto = parseMonto(m[1]);
    comercio = m[2].trim();
    medio = 'CMR Falabella';
  } else if ((m = clean.match(rxNequi))) {
    monto = parseMonto(m[1]);
    comercio = m[2].trim();
    medio = 'Nequi';
  } else if ((m = clean.match(rxNequiRecibe))) {
    tipo = 'Ingreso';
    monto = parseMonto(m[1]);
    comercio = m[2].trim();
    medio = 'Nequi';
  } else if ((m = clean.match(rxPago))) {
    monto = parseMonto(m[1]);
    comercio = m[2].trim();
    medio = 'PSE / Cta *' + m[3].trim();
  } else if ((m = clean.match(rxTransf))) {
    monto = parseMonto(m[1]);
    comercio = m[2].trim();
    medio = 'Transferencia Cta *' + m[3].trim();
  } else if ((m = clean.match(rxRecibiste))) {
    tipo = 'Ingreso';
    monto = parseMonto(m[1]);
    comercio = m[2].trim();
    medio = 'Abono en cuenta';
  } else if ((m = clean.match(rxRetiro))) {
    monto = parseMonto(m[1]);
    comercio = 'Retiro Cajero ' + m[2].trim();
    medio = 'Efectivo';
  } else {
    const rxAnyMonto = /\$\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{2})?)/;
    const mAny = clean.match(rxAnyMonto);
    if (!mAny) return null;
    monto = parseMonto(mAny[1]);
    if (/recibiste|abono|reembolso|nomina/i.test(clean)) {
      tipo = 'Ingreso';
    }
    comercio = entidad;
  }

  const comUpper = (comercio + ' ' + clean).toUpperCase();
  let categoriaSugerida: CategoriaMovimiento = tipo === 'Ingreso' ? 'Ingreso Adicional' : 'Gastos opcionales';

  if (tipo === 'Egreso') {
    if (/TELECOM|CLARO|MOVISTAR|TIGO|ETB|ENEL|CODENSA|VANTI|ACUEDUCTO|ENERGIA|GAS|INTERNET|CELULAR/.test(comUpper)) {
      categoriaSugerida = 'Servicios';
    } else if (/CREDITO|TARJETA|RAPPICARD|NUBANK|DAVIVIENDA|PRESTAMO|CUOTA/.test(comUpper)) {
      categoriaSugerida = 'Deudas';
    } else if (/ARRIENDO|CONJUNTO|ADMIN|JELPIT|TIMIZA|MERCADO|EXITO|CARULLA|D1|ARA|OLIMPICA/.test(comUpper)) {
      categoriaSugerida = 'Gastos fijos';
    } else if (/AHORRO|INVERSION|CDT|FONDO/.test(comUpper)) {
      categoriaSugerida = 'Ahorro';
    }
  }

  return {
    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    entidad,
    tipo,
    comercio,
    medio,
    monto,
    categoriaSugerida,
    descripcionSugerida: comercio + ' (' + medio + ')',
    fecha: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    imported: false
  };
}

export const SAMPLE_BANK_NOTIFICATIONS = [
  {
    bank: 'Genérico',
    badge: '⚡ Probar Notificación de Ejemplo',
    title: 'Compra en Supermercado por $45.000',
    text: 'Bancolombia le informa que compraste $45.000 en SUPERMERCADO EXITO con tu Tarjeta *4129 el 19/10/2026.'
  }
];
