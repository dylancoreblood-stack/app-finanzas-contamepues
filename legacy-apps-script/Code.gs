const MASTER_SPREADSHEET_ID = '15zeBqmLwJ-U5NLtzKg7d76jBiRWAgt6p3-7h5l1K1XQ';
const MASTER_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby4XT6nKdfzhHBcAZy9Rt1dFqjxMjkrGYX2zbF7vQVx_h1Hyj6yzaEXSw8Ed274G-eaww/exec';

/**
 * Crea el menú y actualiza automáticamente el botón de la pestaña Inicio con el ID propio del usuario
 */
function onOpen() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) {
      actualizarEnlaceBotonB9(ss);
    }
  } catch (e) {}

  try {
    SpreadsheetApp.getUi()
      .createMenu('🚀 Finanzas Fáciles')
      .addItem('🎨 Actualizar Diseño y Tutorial en pestaña "🚀 Inicio"', 'actualizarPestanaInicioTutorial')
      .addToUi();
  } catch (e) {}
}

/**
 * Vincula automáticamente el ID único del archivo al botón B9 para que la Web App nunca pierda la conexión
 */
function actualizarEnlaceBotonB9(ss) {
  try {
    const sheet = ss.getSheetByName('🚀 Inicio');
    if (!sheet) return;
    const sheetId = ss.getId();
    const targetUrl = MASTER_WEB_APP_URL + '?id=' + sheetId;
    const btnCell = sheet.getRange('B9');
    const rich = SpreadsheetApp.newRichTextValue()
      .setText('🚀 ABRIR MI APLICACIÓN WEB AQUÍ')
      .setLinkUrl(targetUrl)
      .build();
    btnCell.setRichTextValue(rich);
  } catch (e) {}
}

function doGet(e) {
  const template = HtmlService.createTemplateFromFile('Index');
  
  // Soporte para vincular automáticamente el Sheet ID vía parámetro de URL (?id=...)
  const targetSheetId = (e && e.parameter && e.parameter.id) ? e.parameter.id : '';
  
  try {
    template.initialPayload = JSON.stringify(getDashboardPayload('', true, targetSheetId));
    template.targetSheetId = targetSheetId;
  } catch (err) {
    const isNeedsCopy = String(err.message || err).includes('NEEDS_COPY');
    template.initialPayload = JSON.stringify({
      error: isNeedsCopy ? 'NEEDS_COPY' : (err.message || String(err)),
      copyUrl: 'https://docs.google.com/spreadsheets/d/' + MASTER_SPREADSHEET_ID + '/copy'
    });
    template.targetSheetId = targetSheetId;
  }

  return template.evaluate()
    .setTitle('Finanzas Fáciles — Control Financiero Inteligente')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}

/**
 * SEGURIDAD: Evita inyección de fórmulas maliciosas en Google Sheets (=, +, -, @)
 */
function sanitizeCellText(input, maxLen) {
  if (input === null || input === undefined) return '';
  let str = String(input).trim();
  if (maxLen && str.length > maxLen) str = str.substring(0, maxLen);
  if (/^[=+\-@]/.test(str)) {
    str = "'" + str;
  }
  return str;
}

/**
 * Obtiene el correo de la cuenta de Google actualmente sincronizada
 */
function getSyncedUserEmail() {
  try {
    const activeEmail = Session.getActiveUser().getEmail();
    if (activeEmail) return activeEmail;
  } catch (e) {}
  try {
    const effEmail = Session.getEffectiveUser().getEmail();
    if (effEmail) return effEmail;
  } catch (e) {}
  return 'Cuenta de Google vinculada';
}

/**
 * RESOLUCIÓN INTELIGENTE DE HOJA DE CÁLCULO
 * Resuelve el problema de permisos: si un nuevo usuario abre la app, busca SU propia copia
 * en su Google Drive en lugar de intentar escribir en la plantilla maestra de Dylan.
 */
function getSpreadsheet(explicitId) {
  // 1. Si se pasa un ID explícito (vía URL ?id= o localStorage de la PWA)
  if (explicitId && String(explicitId).trim() !== '') {
    const cleanId = String(explicitId).trim();
    try {
      const ss = SpreadsheetApp.openById(cleanId);
      if (ss) return ss;
    } catch (e) {}
  }

  // 2. Si el script corre en una copia activa que NO es la maestra (usuario en su propia copia)
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) {
      const activeId = active.getId();
      // Si la hoja activa NO es la maestra original, es la copia privada del usuario donde tiene permisos plenos
      if (activeId !== MASTER_SPREADSHEET_ID) {
        return active;
      }
      
      // Si es la plantilla maestra original, verificamos si el usuario actual es el dueño (Dylan)
      const userEmail = Session.getActiveUser().getEmail();
      const owner = active.getOwner();
      const ownerEmail = owner ? owner.getEmail() : '';
      if (userEmail && ownerEmail && userEmail.toLowerCase() === ownerEmail.toLowerCase()) {
        return active;
      }
    }
  } catch (e) {}

  // 3. Búsqueda automática en el Google Drive del comprador de su copia personal
  try {
    const query = "(title contains 'Finanzas Fáciles' or title contains 'Plantilla Maestra' or title contains 'Gastos') and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false";
    const searchFiles = DriveApp.searchFiles(query);
    while (searchFiles.hasNext()) {
      const file = searchFiles.next();
      // Si el archivo NO es la plantilla maestra original de Dylan, ¡es la copia privada del cliente!
      if (file.getId() !== MASTER_SPREADSHEET_ID) {
        return SpreadsheetApp.open(file);
      }
    }
  } catch (e) {}

  // 4. Si el usuario actual es el dueño de la plantilla maestra (Dylan)
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}

  throw new Error('NEEDS_COPY: No se encontró tu copia personal de Finanzas Fáciles en tu Google Drive.');
}

function parseMonto(val) {
  if (typeof val === 'number') return Math.max(0, Math.round(val));
  if (!val) return 0;
  let str = String(val).trim();
  str = str.replace(/[,.]\d{2}$/, '');
  const clean = str.replace(/[^0-9-]+/g, '');
  return Math.max(0, Number(clean) || 0);
}

function extractLifeMonth(sheetName) {
  const str = String(sheetName || '');
  const match840 = str.match(/(\d{3})\s*\/\s*840/);
  if (match840) return parseInt(match840[1], 10);
  return null;
}

function getValidSheets(ss) {
  const allSheets = ss.getSheets().filter(s => {
    const nameLower = s.getName().toLowerCase();
    return !nameLower.includes('inicio') && !nameLower.includes('instrucciones');
  });

  const filtered840 = allSheets.filter(s => {
    const num = extractLifeMonth(s.getName());
    return num !== null && num >= MIN_LIFE_MONTH;
  });

  if (filtered840.length > 0) {
    filtered840.sort((a, b) => extractLifeMonth(b.getName()) - extractLifeMonth(a.getName()));
    return filtered840;
  }

  return allSheets.length > 0 ? allSheets : [ss.getSheets()[0]];
}

function resolveTargetSheet(sheetName, explicitId) {
  const ss = getSpreadsheet(explicitId);
  if (sheetName && String(sheetName).trim() !== '') {
    const s = ss.getSheetByName(String(sheetName).trim());
    if (s && !s.getName().toLowerCase().includes('inicio')) return s;
  }
  return getValidSheets(ss)[0];
}

function getDashboardPayload(sheetName, forceRefreshHistory, explicitId) {
  const ss = getSpreadsheet(explicitId);
  const validSheets = getValidSheets(ss);
  const validSheetNames = validSheets.map(s => s.getName());

  const activeSheet = resolveTargetSheet(sheetName, explicitId);
  const activeSheetName = activeSheet.getName();

  const activeData = getSheetDataDetails(activeSheet);
  const history = getCachedHistory(validSheets, forceRefreshHistory, explicitId);

  return {
    spreadsheetId: ss.getId(),
    userEmail: getSyncedUserEmail(),
    sheets: validSheetNames,
    sheetName: activeSheetName,
    titleCell: activeData.titleCell,
    headerRow: activeData.headerRow,
    metas: activeData.metas,
    transactions: activeData.transactions,
    history: history
  };
}

function getCachedHistory(validSheets, forceRefresh, explicitId) {
  const cacheKey = CACHE_KEY_HISTORY + '_' + (explicitId || 'DEFAULT');
  const cache = CacheService.getUserCache();
  if (!forceRefresh) {
    const cached = cache.get(cacheKey);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
  }

  const history = validSheets.map(sheet => {
    const details = getSheetDataDetails(sheet);
    let ingresos = 0;
    let egresos = 0;

    details.transactions.forEach(t => {
      if (String(t.tipo).toLowerCase() === 'ingreso') {
        ingresos += t.monto;
      } else {
        egresos += t.monto;
      }
    });

    return {
      sheetName: sheet.getName(),
      title: details.titleCell || sheet.getName(),
      ingresos: ingresos,
      egresos: egresos,
      libre: ingresos - egresos
    };
  });

  try { cache.put(cacheKey, JSON.stringify(history), 300); } catch (e) {}
  return history;
}

function invalidateHistoryCache(explicitId) {
  const cacheKey = CACHE_KEY_HISTORY + '_' + (explicitId || 'DEFAULT');
  try { CacheService.getUserCache().remove(cacheKey); } catch (e) {}
}

function getSheetDataDetails(sheet) {
  const lastRow = Math.max(sheet.getLastRow(), 16);
  const lastCol = Math.max(sheet.getLastColumn(), 9);
  const rawValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();

  let headerRowIndex = 6;
  for (let r = 0; r < Math.min(15, rawValues.length); r++) {
    if (String(rawValues[r][0] || '').trim().toLowerCase() === 'tipo') {
      headerRowIndex = r;
      break;
    }
  }

  const metas = [];
  for (let r = 0; r < headerRowIndex; r++) {
    const colG_Name = String(rawValues[r][6] || '').trim();
    const colE_Name = String(rawValues[r][4] || '').trim();

    if (colG_Name !== '' && isNaN(colG_Name) && colG_Name.toLowerCase() !== 'meta') {
      metas.push({
        row: r + 1,
        colName: 7,
        colVal: 9,
        nombre: colG_Name,
        acumulado: parseMonto(rawValues[r][8])
      });
    } else if (colE_Name !== '' && isNaN(colE_Name) && colE_Name.toLowerCase() !== 'meta' && colE_Name.toLowerCase() !== 'pagado') {
      metas.push({
        row: r + 1,
        colName: 5,
        colVal: 7,
        nombre: colE_Name,
        acumulado: parseMonto(rawValues[r][6])
      });
    }
  }

  const transactions = [];
  for (let r = headerRowIndex + 1; r < rawValues.length; r++) {
    const tipo = String(rawValues[r][0] || '').trim();
    const categoria = String(rawValues[r][1] || '').trim();
    const desc = String(rawValues[r][2] || '').trim();
    const montoRaw = rawValues[r][3];
    const pagadoRaw = rawValues[r][4];

    if (tipo !== '' || desc !== '') {
      transactions.push({
        row: r + 1,
        tipo: tipo || 'Egreso',
        categoria: categoria || 'Gastos opcionales',
        desc: desc || '(Sin descripción)',
        monto: parseMonto(montoRaw),
        pagado: pagadoRaw === true || String(pagadoRaw).toUpperCase() === 'TRUE'
      });
    }
  }

  return {
    titleCell: String(rawValues[0][0] || sheet.getName()),
    headerRow: headerRowIndex + 1,
    metas: metas,
    transactions: transactions
  };
}

/**
 * ============================================================================
 * FUNCIONES DE ESCRITURA SEGURA Y ACTUALIZACIÓN EN TIEMPO REAL
 * ============================================================================
 */
function setupFirstMonthForClient(config, explicitId) {
  const lock = LockService.getUserLock();
  lock.waitLock(10000);
  try {
    const sheet = resolveTargetSheet(config ? config.sheetName : '', explicitId);
    const details = getSheetDataDetails(sheet);

    const metaNames = [
      sanitizeCellText((config && config.meta1) ? config.meta1 : 'Fondo de Emergencia', 60),
      sanitizeCellText((config && config.meta2) ? config.meta2 : 'Meta Principal (Auto / Viaje)', 60),
      sanitizeCellText((config && config.meta3) ? config.meta3 : 'Inversiones / Cuentas', 60)
    ];

    const usesColG = details.metas.length === 0 || details.metas[0].colName === 7;
    const nameCol = usesColG ? 7 : 5;
    const valCol = usesColG ? 9 : 7;

    for (let i = 0; i < 3; i++) {
      const targetRow = (details.metas[i] && details.metas[i].row) ? details.metas[i].row : (i + 2);
      if (metaNames[i]) {
        sheet.getRange(targetRow, nameCol).setValue(metaNames[i]);
        const currentVal = sheet.getRange(targetRow, valCol).getValue();
        if (currentVal === '' || currentVal === null) {
          sheet.getRange(targetRow, valCol).setValue(0);
        }
      }
    }

    const sueldoMonto = parseMonto(config ? config.sueldo : 0);
    let sueldoRow = -1;
    for (let i = 0; i < details.transactions.length; i++) {
      const t = details.transactions[i];
      if (
        String(t.tipo).toLowerCase() === 'ingreso' &&
        (String(t.categoria).toLowerCase().includes('sueldo') || String(t.desc).toLowerCase().includes('sueldo'))
      ) {
        sueldoRow = t.row;
        break;
      }
    }

    if (sueldoRow !== -1) {
      sheet.getRange(sueldoRow, 4).setValue(sueldoMonto);
    } else {
      const firstDataRow = details.headerRow + 1;
      sheet.getRange(firstDataRow, 1, 1, 5).setValues([[
        'Ingreso',
        'Ingreso Sueldo',
        'Sueldo o Ingreso principal',
        sueldoMonto,
        false
      ]]);
      sheet.getRange(firstDataRow, 5).insertCheckboxes();
    }

    SpreadsheetApp.flush();
    invalidateHistoryCache(explicitId);
    return getDashboardPayload(sheet.getName(), true, explicitId);
  } finally {
    lock.releaseLock();
  }
}

function updatePaidStatus(sheetName, rowNumber, isPaid, explicitId) {
  const lock = LockService.getUserLock();
  lock.waitLock(10000);
  try {
    const sheet = resolveTargetSheet(sheetName, explicitId);
    const r = Math.max(2, Number(rowNumber));
    const cell = sheet.getRange(r, 5);
    cell.setValue(Boolean(isPaid));
    SpreadsheetApp.flush();
    invalidateHistoryCache(explicitId);
    return { success: true, row: r, pagado: Boolean(isPaid) };
  } finally {
    lock.releaseLock();
  }
}

function updateRowData(sheetName, rowNumber, newDesc, newAmount, explicitId) {
  const lock = LockService.getUserLock();
  lock.waitLock(10000);
  try {
    const sheet = resolveTargetSheet(sheetName, explicitId);
    const r = Math.max(2, Number(rowNumber));
    const cleanDesc = sanitizeCellText(newDesc, 120);
    const cleanAmount = parseMonto(newAmount);
    sheet.getRange(r, 3, 1, 2).setValues([[cleanDesc, cleanAmount]]);
    SpreadsheetApp.flush();
    invalidateHistoryCache(explicitId);
    return getDashboardPayload(sheet.getName(), true, explicitId);
  } finally {
    lock.releaseLock();
  }
}

function updateMetaRow(sheetName, rowNumber, newName, newAmount, explicitId) {
  const lock = LockService.getUserLock();
  lock.waitLock(10000);
  try {
    const sheet = resolveTargetSheet(sheetName, explicitId);
    const r = Math.max(2, Number(rowNumber));
    const cleanAmount = parseMonto(newAmount);

    const nameInG = String(sheet.getRange(r, 7).getValue() || '').trim();
    const isMasterLayout = (nameInG !== '' && isNaN(nameInG)) || String(sheet.getRange(r, 5).getValue() || '').trim() === '';

    const nameCol = isMasterLayout ? 7 : 5;
    const valCol = isMasterLayout ? 9 : 7;

    if (newName && String(newName).trim() !== '') {
      sheet.getRange(r, nameCol).setValue(sanitizeCellText(newName, 60));
    }
    sheet.getRange(r, valCol).setValue(cleanAmount);

    SpreadsheetApp.flush();
    return getDashboardPayload(sheet.getName(), false, explicitId);
  } finally {
    lock.releaseLock();
  }
}

function updateMetaAmount(sheetName, rowNumber, newAmount, explicitId) {
  return updateMetaRow(sheetName, rowNumber, null, newAmount, explicitId);
}

function importBancolombiaEmailToSheet(sheetName, emailId, item, explicitId) {
  const lock = LockService.getUserLock();
  lock.waitLock(10000);
  try {
    const sheet = resolveTargetSheet(sheetName, explicitId);
    const details = getSheetDataDetails(sheet);
    const startRow = details.headerRow + 1;
    const lastRow = Math.max(sheet.getLastRow(), startRow);
    const scanRows = sheet.getRange(startRow, 1, (lastRow - startRow) + 10, 3).getValues();

    let targetRow = -1;
    for (let i = 0; i < scanRows.length; i++) {
      if (String(scanRows[i][0]).trim() === '' && String(scanRows[i][2]).trim() === '') {
        targetRow = startRow + i;
        break;
      }
    }
    if (targetRow === -1) targetRow = lastRow + 1;

    const cleanTipo = (String(item.tipo).toLowerCase() === 'ingreso') ? 'Ingreso' : 'Egreso';
    const cleanCat = sanitizeCellText(item.categoria || 'Gastos opcionales', 50);
    const cleanDesc = sanitizeCellText(item.desc || 'Movimiento', 120);
    const cleanAmount = parseMonto(item.monto);
    const isPaid = Boolean(item.pagado);

    sheet.getRange(targetRow, 1, 1, 5).setValues([[
      cleanTipo,
      cleanCat,
      cleanDesc,
      cleanAmount,
      isPaid
    ]]);
    sheet.getRange(targetRow, 5).insertCheckboxes();
    sheet.getRange(targetRow, 5).setValue(isPaid);

    if (emailId) {
      const props = PropertiesService.getUserProperties();
      let importedIds = [];
      try { importedIds = JSON.parse(props.getProperty(IMPORTED_IDS_PROP) || '[]'); } catch (e) {}
      if (importedIds.indexOf(emailId) === -1) {
        importedIds.push(String(emailId));
        if (importedIds.length > 250) importedIds = importedIds.slice(-250);
        props.setProperty(IMPORTED_IDS_PROP, JSON.stringify(importedIds));
      }
    }

    SpreadsheetApp.flush();
    invalidateHistoryCache(explicitId);
    return getDashboardPayload(sheet.getName(), true, explicitId);
  } finally {
    lock.releaseLock();
  }
}

function addNewTransaction(sheetName, item, explicitId) {
  return importBancolombiaEmailToSheet(sheetName, null, {
    tipo: item.tipo,
    categoria: item.categoria,
    desc: item.desc,
    monto: item.monto,
    pagado: Boolean(item.pagado)
  }, explicitId);
}

function clearTransactionRow(sheetName, rowNumber, explicitId) {
  const lock = LockService.getUserLock();
  lock.waitLock(10000);
  try {
    const sheet = resolveTargetSheet(sheetName, explicitId);
    const r = Math.max(2, Number(rowNumber));
    sheet.getRange(r, 1, 1, 4).clearContent();
    sheet.getRange(r, 5).setValue(false);
    SpreadsheetApp.flush();
    invalidateHistoryCache(explicitId);
    return getDashboardPayload(sheet.getName(), true, explicitId);
  } finally {
    lock.releaseLock();
  }
}

function duplicateMonthSheet(sourceSheetName, newSheetName, newTitleCell, explicitId) {
  const ss = getSpreadsheet(explicitId);
  const cleanSheetName = sanitizeCellText(newSheetName, 40);
  if (ss.getSheetByName(cleanSheetName)) {
    throw new Error('Ya existe una pestaña con el nombre "' + cleanSheetName + '".');
  }
  const sourceSheet = resolveTargetSheet(sourceSheetName, explicitId);

  const newSheet = sourceSheet.copyTo(ss);
  newSheet.setName(cleanSheetName);
  ss.setActiveSheet(newSheet);
  ss.moveActiveSheet(2);

  if (newTitleCell && String(newTitleCell).trim() !== '') {
    newSheet.getRange('A1').setValue(sanitizeCellText(newTitleCell, 80));
  }

  const details = getSheetDataDetails(newSheet);
  const startRow = details.headerRow + 1;
  const lastRow = newSheet.getLastRow();
  if (lastRow >= startRow) {
    const numRows = lastRow - startRow + 1;
    const falseArray = Array.from({ length: numRows }, () => [false]);
    newSheet.getRange(startRow, 5, numRows, 1).setValues(falseArray);
  }

  SpreadsheetApp.flush();
  invalidateHistoryCache(explicitId);
  return getDashboardPayload(cleanSheetName, true, explicitId);
}

/**
 * ============================================================================
 * ESCÁNER INTELIGENTE DE CORREOS (DESCRIPCIÓN HUMANA CLARA + MONTO DESTACADO)
 * ============================================================================
 */
function getFinancialEmails(daysBack, mode) {
  const days = Math.min(Math.max(Number(daysBack) || 15, 1), 90);
  let query = '';
  if (String(mode).toUpperCase() === 'BANCOLOMBIA') {
    query = 'from:bancolombia newer_than:' + days + 'd';
  } else {
    query = '(bancolombia OR davivienda OR nubank OR "nu.com.co" OR rappicard OR nequi OR daviplata OR pse OR ach OR jelpit OR avalpay OR epayco OR wompi OR "compraste" OR "pagaste" OR "transferiste") newer_than:' + days + 'd';
  }

  const threads = GmailApp.search(query, 0, 35);
  const props = PropertiesService.getUserProperties();
  let importedIds = [];
  try { importedIds = JSON.parse(props.getProperty(IMPORTED_IDS_PROP) || '[]'); } catch (e) {}

  const results = [];
  threads.forEach(thread => {
    const messages = thread.getMessages();
    messages.forEach(msg => {
      const msgId = msg.getId();
      const subject = msg.getSubject() || '';
      const from = msg.getFrom() || '';
      const body = msg.getPlainBody() || '';
      const parsed = parseColombianFinancialEmail(subject, from, body);

      if (parsed && parsed.monto > 0) {
        results.push({
          id: msgId,
          entidad: parsed.entidad,
          fecha: Utilities.formatDate(msg.getDate(), 'America/Bogota', 'dd/MM/yyyy HH:mm'),
          tipo: parsed.tipo,
          accionTitulo: parsed.accionTitulo,
          explicacionCorta: parsed.explicacionCorta,
          categoria: parsed.categoriaSugerida,
          comercio: parsed.comercio,
          medio: parsed.medio,
          descripcionSugerida: parsed.comercio + ' (' + parsed.medio + ')',
          monto: parsed.monto,
          imported: importedIds.indexOf(msgId) !== -1
        });
      }
    });
  });

  results.sort((a, b) => (a.id < b.id ? 1 : -1));
  return results;
}

function parseColombianFinancialEmail(subject, from, text) {
  const clean = (subject + ' ' + text).replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ');
  const fromLower = (from + ' ' + subject).toLowerCase();

  let entidad = 'Banco / Pasarela';
  if (fromLower.includes('bancolombia')) entidad = 'Bancolombia';
  else if (fromLower.includes('davivienda') || fromLower.includes('daviplata')) entidad = 'Davivienda';
  else if (fromLower.includes('nu.com') || fromLower.includes('nubank')) entidad = 'Nu Colombia';
  else if (fromLower.includes('falabella')) entidad = 'Banco Falabella';
  else if (fromLower.includes('lulo')) entidad = 'Lulo Bank';
  else if (fromLower.includes('colpatria')) entidad = 'Scotiabank Colpatria';
  else if (fromLower.includes('tuya')) entidad = 'Tarjeta Tuya';
  else if (fromLower.includes('rappi')) entidad = 'RappiPay';
  else if (fromLower.includes('nequi')) entidad = 'Nequi';
  else if (fromLower.includes('dale')) entidad = 'Dale!';
  else if (fromLower.includes('pse') || fromLower.includes('ach')) entidad = 'PSE';
  else if (fromLower.includes('jelpit')) entidad = 'Jelpit';
  else if (fromLower.includes('avalpay')) entidad = 'AvalPay';
  else if (fromLower.includes('epayco') || fromLower.includes('wompi')) entidad = 'Pasarela Web';

  let tipo = 'Egreso';
  let comercio = 'Movimiento Financiero';
  let medio = entidad;
  let monto = 0;
  let accionVerbo = 'Pago o compra en';

  // 1. Bancolombia / Estándar
  const rxCompra = /Compraste\s+\$([0-9.,]+)\s+en\s+(.+?)\s+con\s+tu\s+([^\s,]+(?:\s+\*\d+)?)/i;
  const rxPago = /Pagaste\s+\$([0-9.,]+)\s+a\s+(.+?)\s+desde\s+tu\s+producto\s+\*?(\d+)/i;
  const rxTransf = /Transferiste\s+\$([0-9.,]+)\s+a\s+(.+?)\s+desde\s+tu\s+producto\s+\*?(\d+)/i;
  const rxRecibiste = /(?:Recibiste|Recibiras|Recibirás)\s+\$([0-9.,]+).*?(?:por parte de|de)\s+([^.]+?)(?:\.|\s+\d{2}:\d{2})/i;
  const rxRetiro = /Retiraste\s+\$([0-9.,]+)\s+en\s+(.+?)\s+con/i;

  // 2. Nu Colombia / Falabella / Nequi / Lulo
  const rxNuCompra = /(?:Compra aprobada en|Compraste en)\s+([^.]+?)\s+por\s+\$([0-9.,]+)/i;
  const rxFalabella = /(?:Compra por|Compraste por)\s+\$([0-9.,]+)\s+(?:en|con tu)\s+([^.]+?)(?:\.|$)/i;
  const rxNequi = /(?:Enviaste|Pagaste)\s+\$([0-9.,]+)\s+a\s+([^.]+?)(?:\.|$)/i;
  const rxNequiRecibe = /(?:Te transfirieron|Te enviaron|Recibiste)\s+\$([0-9.,]+)\s+(?:de|por parte de)\s+([^.]+?)(?:\.|$)/i;

  let m;
  if ((m = clean.match(rxCompra))) {
    monto = parseMonto(m[1]);
    comercio = m[2].trim();
    medio = m[3].trim();
    accionVerbo = 'Compra con tarjeta en';
  } else if ((m = clean.match(rxNuCompra))) {
    monto = parseMonto(m[2]);
    comercio = m[1].trim();
    medio = 'Tarjeta Nu';
    accionVerbo = 'Compra aprobada en';
  } else if ((m = clean.match(rxFalabella))) {
    monto = parseMonto(m[1]);
    comercio = m[2].trim();
    medio = 'CMR Falabella';
    accionVerbo = 'Compra con Falabella en';
  } else if ((m = clean.match(rxNequi))) {
    monto = parseMonto(m[1]);
    comercio = m[2].trim();
    medio = 'Nequi';
    accionVerbo = 'Envío de dinero a';
  } else if ((m = clean.match(rxNequiRecibe))) {
    tipo = 'Ingreso';
    monto = parseMonto(m[1]);
    comercio = m[2].trim();
    medio = 'Nequi';
    accionVerbo = 'Dinero recibido en Nequi de';
  } else if ((m = clean.match(rxPago))) {
    monto = parseMonto(m[1]);
    comercio = m[2].trim();
    medio = 'PSE / Cta *' + m[3].trim();
    accionVerbo = 'Pago electrónico a';
  } else if ((m = clean.match(rxTransf))) {
    monto = parseMonto(m[1]);
    comercio = m[2].trim();
    medio = 'Transferencia Cta *' + m[3].trim();
    accionVerbo = 'Transferencia enviada a';
  } else if ((m = clean.match(rxRecibiste))) {
    tipo = 'Ingreso';
    monto = parseMonto(m[1]);
    comercio = m[2].trim();
    medio = 'Abono en cuenta';
    accionVerbo = 'Dinero recibido de';
  } else if ((m = clean.match(rxRetiro))) {
    monto = parseMonto(m[1]);
    comercio = 'Retiro Cajero ' + m[2].trim();
    medio = 'Efectivo';
    accionVerbo = 'Retiro de efectivo en';
  } else {
    const rxAnyMonto = /\$\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{2})?)/;
    const mAny = clean.match(rxAnyMonto);
    if (!mAny) return null;
    monto = parseMonto(mAny[1]);
    if (/recibiste|abono|reembolso|nomina/i.test(clean)) {
      tipo = 'Ingreso';
      accionVerbo = 'Ingreso / Abono de';
    }
    const cleanSubject = subject
      .replace(/alertas\s*y\s*notificaciones/ig, '')
      .replace(/notificacion(es)?\s*bancolombia/ig, '')
      .replace(/[-:|]/g, ' ')
      .trim();
    comercio = cleanSubject.substring(0, 42).trim() || entidad;
  }

  const comUpper = (comercio + ' ' + clean).toUpperCase();
  let categoriaSugerida = tipo === 'Ingreso' ? 'Ingreso Adicional' : 'Gastos opcionales';

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
    entidad: entidad,
    tipo: tipo,
    monto: monto,
    comercio: comercio,
    medio: medio,
    categoriaSugerida: categoriaSugerida,
    accionTitulo: accionVerbo + ' ' + comercio,
    explicacionCorta: (tipo === 'Ingreso' ? 'Ingreso detectado' : 'Gasto sugerido en ' + categoriaSugerida) + ' · Medio: ' + medio
  };
}

/**
 * ============================================================================
 * GENERADOR AUTOMÁTICO DEL TUTORIAL EN LA PESTAÑA "🚀 Inicio" DEL EXCEL
 * ============================================================================
 */
function actualizarPestanaInicioTutorial() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('🚀 Inicio');
  if (!sheet) {
    sheet = ss.insertSheet('🚀 Inicio', 0);
  }

  const currentCellB9 = sheet.getRange('B9').getRichTextValue();
  const existingUrl = (currentCellB9 && currentCellB9.getLinkUrl()) ? currentCellB9.getLinkUrl() : '';

  sheet.clearContents();
  sheet.setColumnWidth(1, 45);
  sheet.setColumnWidth(2, 760);
  sheet.setColumnWidth(3, 45);

  const rowsData = [
    ['', ''],
    ['', '✨ Bienvenido a Finanzas Fáciles'],
    ['', 'Tu sistema inteligente de control financiero, lectura automática de bancos y proyección de vida en 840 meses'],
    ['', ''],
    ['', '   1️⃣  Haz clic en el botón verde de abajo para abrir tu Aplicación Web en tu celular o computador.'],
    ['', '   2️⃣  La primera vez, autoriza el acceso a tu cuenta de Google (explicado abajo) para activar el escáner.'],
    ['', '   3️⃣  Dentro de la app, toca el botón "📱 Instalar App" arriba para agregarla a la pantalla de tu iPhone o Android.'],
    ['', ''],
    ['', '🚀 ABRIR MI APLICACIÓN WEB AQUÍ'],
    ['', '💡 Tus datos se guardan automáticamente en tu hoja de cálculo. Nunca necesitas editar este Excel a mano.'],
    ['', ''],
    ['', '🛡️ ¿POR QUÉ GOOGLE TE PIDE AUTORIZAR AL ABRIR LA APP POR PRIMERA VEZ?'],
    ['', '   • ¡Tus datos son 100% privados! La app lee ÚNICAMENTE tus notificaciones bancarias para evitar que tengas que digitar cada compra.'],
    ['', '   • Ningún dato bancario ni contraseña sale a servidores externos. Todo corre dentro de tu propia cuenta de Google.'],
    ['', '   • Al abrirla: Si Google te muestra "Google no ha verificado esta app", simplemente haz clic en "Configuración avanzada" y luego en "Ir a Finanzas Fáciles (seguro)" para permitir la lectura de tus compras.'],
    ['', ''],
    ['', '🔥 VENTAJA EXCLUSIVA: ESCÁNER AUTOMÁTICO DE BANCOS Y PSE'],
    ['', '   • Detecta compras de Bancolombia, Nu, Davivienda, Falabella, Nequi, Lulo Bank, PSE, etc.'],
    ['', '   • Te resume claramente el comercio y monto para que lo agregues al mes con 1 solo clic.'],
    ['', ''],
    ['', '🧭 TUTORIAL RÁPIDO: ¿CÓMO FUNCIONAN LOS BOTONES DE TU APP?'],
    ['', '   📅 Selector de Mes  ➔  Cambia entre tus meses creados (ej. octubre 428/840, noviembre 429/840).'],
    ['', '   ⚙️ Sueldo y Metas   ➔  Configura tu sueldo mensual base y tus 3 fondos de ahorro.'],
    ['', '   📋 Nuevo Mes        ➔  Duplica el mes actual para empezar el mes siguiente con pagos en cero.'],
    ['', '   ✨ Tutorial         ➔  Abre la guía interactiva paso a paso en la app.'],
    ['', '   📱 Instalar App     ➔  Fija la aplicación en la pantalla de tu celular como app nativa.'],
    ['', '   ↻ Actualizar        ➔  Sincroniza al instante tus datos entre la hoja y la pantalla.'],
    ['', '   ◐ Tema              ➔  Alterna entre Modo Claro (Crema Monai) y Modo Oscuro OLED.'],
    ['', '   ＋ Añadir Gasto     ➔  (Botón verde inferior) Registra manualmente cualquier gasto en segundos.'],
    ['', '   📥 Correos y PSE    ➔  (Barra inferior) Escanea tus notificaciones bancarias recientes.']
  ];

  sheet.getRange(1, 1, rowsData.length, 2).setValues(rowsData);

  sheet.getRange('B2').setFontSize(18).setFontWeight('bold').setFontColor('#141413');
  sheet.getRange('B3').setFontSize(11).setFontColor('#555555').setFontStyle('italic');
  sheet.getRange('B5:B7').setFontSize(11).setFontColor('#222222');

  const btnRange = sheet.getRange('B9');
  btnRange.setBackground('#18A957').setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(13).setHorizontalAlignment('center');
  if (existingUrl) {
    const rich = SpreadsheetApp.newRichTextValue().setText('🚀 ABRIR MI APLICACIÓN WEB AQUÍ').setLinkUrl(existingUrl).build();
    btnRange.setRichTextValue(rich);
  }

  sheet.getRange('B10').setFontSize(10).setFontColor('#666666').setHorizontalAlignment('center');

  // Bloque Anti-Miedo (Seguridad de Google)
  sheet.getRange('B12').setBackground('#F0F4FF').setFontColor('#1E3A8A').setFontWeight('bold').setFontSize(11);
  sheet.getRange('B13:B15').setBackground('#F8FAFC').setFontColor('#1E293B').setFontSize(10);

  // Bloque Ventaja Competitiva (Escáner de Bancos)
  sheet.getRange('B17').setBackground('#E8F7EE').setFontColor('#0F6E38').setFontWeight('bold').setFontSize(11);
  sheet.getRange('B18:B19').setBackground('#F4FBF7').setFontColor('#141413').setFontSize(10);

  // Bloque Tutorial de Íconos
  sheet.getRange('B21').setBackground('#EFECE6').setFontColor('#141413').setFontWeight('bold').setFontSize(11);
  sheet.getRange('B22:B30').setBackground('#FAF9F6').setFontColor('#222222').setFontSize(10);

  SpreadsheetApp.flush();
}
