var electron      = require('electron');
var app           = electron.app;
var BrowserWindow = electron.BrowserWindow;
var ipcMain       = electron.ipcMain;
var path          = require('path');
var fs            = require('fs');
var autoUpdater   = require('electron-updater').autoUpdater;

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// ── GLOBAL ERROR HANDLERS ─────────────────────────────────────────────────────
// Prevent silent crashes from unhandled exceptions/rejections in IPC handlers
process.on('uncaughtException', function(err) {
  console.error('[FATAL] Uncaught Exception:', err.message, err.stack);
});
process.on('unhandledRejection', function(reason) {
  console.error('[FATAL] Unhandled Rejection:', reason);
});

// Safe IPC wrapper: wraps async handlers with try/catch and network retry logic
function safeHandle(channel, handler) {
  ipcMain.handle(channel, async function(event, args) {
    var retries = 3;
    var lastErr = null;
    while (retries > 0) {
      try {
        return await handler(event, args);
      } catch (err) {
        lastErr = err;
        var msg = err.message ? err.message.toLowerCase() : '';
        var isNetworkError = msg.includes('fetch') || msg.includes('network') || msg.includes('timeout') || msg.includes('offline');
        
        if (isNetworkError && retries > 1) {
          retries--;
          console.warn('[IPC Retry] Network hiccup on ' + channel + '. Retries left: ' + retries + '. Waiting 3s...');
          await new Promise(function(r) { setTimeout(r, 3000); });
          continue;
        }
        
        console.error('[IPC Error] ' + channel + ':', err.message);
        return { success: false, ok: false, error: err.message || 'An unexpected error occurred.' };
      }
    }
    console.error('[IPC Error] ' + channel + ' max retries reached:', lastErr.message);
    return { success: false, ok: false, error: 'Network request failed after multiple retries. Please check your connection.' };
  });
}

// Baileys WhatsApp integration dynamic variables
var makeWASocket          = null;
var useMultiFileAuthState = null;
var DisconnectReason      = null;
var pino                  = null;

async function loadBaileys() {
  if (makeWASocket) return;
  var baileys = await import('@whiskeysockets/baileys');
  makeWASocket = baileys.default || baileys.makeWASocket;
  useMultiFileAuthState = baileys.useMultiFileAuthState;
  DisconnectReason = baileys.DisconnectReason;
  pino = require('pino');
}

function getWaSessionPath() {
  try {
    if (app && app.getPath) {
      try {
        return path.join(app.getPath('userData'), 'wa-session');
      } catch (err) {
        var baseDir = process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME || '', 'Library', 'Application Support') : path.join(process.env.HOME || '', '.config'));
        return path.join(baseDir, app.name || 'billflow', 'wa-session');
      }
    }
  } catch(e) {}
  var fallbackDir = process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME || '', 'Library', 'Application Support') : path.join(process.env.HOME || '', '.config'));
  return path.join(fallbackDir, 'billflow', 'wa-session');
}


function getModules() {
  return {
    settings:   require('./db/queries/settings'),
    customers:  require('./db/queries/customers'),
    items:      require('./db/queries/items'),
    bills:      require('./db/queries/bills'),
    billItems:  require('./db/queries/bill-items'),
    taxRecords: require('./db/queries/tax-records'),
    syncQueue:  require('./db/queries/sync-queue'),
    auth:       require('./supabase/auth'),
    sync:       require('./supabase/sync'),
    pdf:        require('./pdf/generator'),
    billNum:    require('./utils/bill-number'),
    webhooks:   require('./n8n/webhooks'),
    encryptor:  require('./crypto/data-encryptor'),
    expenses:   require('./db/queries/expenses'),
    creditNotes:require('./db/queries/credit-notes'),
    inbox:      require('./db/queries/inbox')
  };
}

var mainWindow = null;

function syncEnvToSettings() {
  try {
    var fs = require('fs');
    var path = require('path');
    var envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      var envContent = fs.readFileSync(envPath, 'utf8');
      var env = {};
      envContent.split(/\r?\n/).forEach(function(line) {
        var match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          var value = match[2] ? match[2].trim() : '';
          if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
          if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
          env[match[1]] = value;
        }
      });
      
      var settingsObj = {};
      var url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
      var key = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
      
      if (url) settingsObj['supabase_url'] = url;
      if (key) settingsObj['supabase_anon_key'] = key;
      
      if (Object.keys(settingsObj).length > 0) {
        getModules().settings.setMultiple(settingsObj).catch(function() {});
        console.log('[env-sync] Supabase settings sync triggered from .env');
      }
    }
  } catch (e) {
    console.error('[env-sync] Failed to sync env to settings:', e.message);
  }
}

app.on('ready', function() {
  setupAutoUpdater();
  // Sync env to SQLite settings
  try {
    syncEnvToSettings();
  } catch (e) {
    console.error('[env-sync] Startup sync failed:', e.message);
  }

  var nativeImage = electron.nativeImage;
  var iconPath = path.join(__dirname, 'renderer/assets/icon.png');
  if (!fs.existsSync(iconPath)) {
    iconPath = path.join(__dirname, 'renderer/assets/logo.svg');
  }
  var appIcon = nativeImage.createFromPath(iconPath);

  mainWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 800, minHeight: 600,
    title: 'Satya BillFlow',
    icon: appIcon,
    show: false,
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      nodeIntegration:  false,
      contextIsolation: true,
      sandbox:          true,
      webSecurity:      true,
      allowRunningInsecureContent: false
    }
  });

  // Security Hardening: Prevent unintended external URL navigations & popups
  mainWindow.webContents.on('will-navigate', function(event, url) {
    if (!url.startsWith('file://')) {
      event.preventDefault();
    }
  });
  mainWindow.webContents.setWindowOpenHandler(function() {
    return { action: 'deny' };
  });

  if (app.dock && app.dock.setIcon) {
    app.dock.setIcon(appIcon);
  }
  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  mainWindow.webContents.on('console-message', function(event, level, message, line, sourceId) {
    console.log('[RENDERER CONSOLE]', message, '(' + path.basename(sourceId) + ':' + line + ')');
  });

  mainWindow.once('ready-to-show', function() {
    mainWindow.show();
    
    // Check for OTA Updates in the background
    try {
      autoUpdater.checkForUpdatesAndNotify().catch(function(err) {
        console.log('[OTA Updater] Initial check notice:', err ? err.message : err);
      });
    } catch (err) {
      console.log('[OTA Updater] Initial check exception:', err ? err.message : err);
    }

    // Auto-connect WhatsApp if credentials exist
    var credsPath = path.join(getWaSessionPath(), 'creds.json');
    if (fs.existsSync(credsPath)) {
      try {
        initWhatsApp(function(channel, arg) {
          if (mainWindow) mainWindow.webContents.send(channel, arg);
        });
      } catch (e) {
        console.error('[wa] failed to auto-connect WhatsApp on startup:', e);
      }
    }
  });
});

var waSock = null;
var waStatus = 'disconnected'; // 'connecting', 'qr', 'linked', 'disconnected'
var waQR = '';
var waUser = '';

async function initWhatsApp(eventToSend) {
  await loadBaileys();
  if (waSock) return;
  waStatus = 'connecting';
  if (eventToSend) eventToSend('wa:status-change', { status: waStatus });

  try {
    var auth = await useMultiFileAuthState(getWaSessionPath());
    var state = auth.state;
    var saveCreds = auth.saveCreds;

    waSock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false
    });

    waSock.ev.on('creds.update', saveCreds);

    waSock.ev.on('connection.update', function(update) {
      var connection = update.connection;
      var lastDisconnect = update.lastDisconnect;
      var qr = update.qr;

      if (qr) {
        waStatus = 'qr';
        waQR = qr;
        if (eventToSend) eventToSend('wa:status-change', { status: waStatus, qr: qr });
      }

      if (connection === 'close') {
        var statusCode = lastDisconnect && lastDisconnect.error && lastDisconnect.error.output && lastDisconnect.error.output.statusCode;
        var isLoggedOut = statusCode === DisconnectReason.loggedOut;
        var isBadSession = statusCode === DisconnectReason.badSession;
        var isConflict = statusCode === 440; // Stream Errored (conflict) / connectionReplaced
        var shouldReconnect = !isLoggedOut && !isBadSession && !isConflict;
        
        console.log('[wa] connection closed due to ', lastDisconnect && lastDisconnect.error, ', reconnecting ', shouldReconnect);
        waSock = null;
        waQR = '';
        waUser = '';
        
        if (shouldReconnect) {
          waStatus = 'connecting';
          if (eventToSend) eventToSend('wa:status-change', { status: waStatus });
          setTimeout(function() {
            initWhatsApp(eventToSend);
          }, 5000);
        } else {
          waStatus = 'disconnected';
          if (eventToSend) eventToSend('wa:status-change', { status: waStatus });
          // ONLY delete session files if explicitly logged out by user/WhatsApp
          if (isLoggedOut || isBadSession) {
            var currentWaPath = getWaSessionPath();
            if (fs.existsSync(currentWaPath)) {
              try {
                fs.rmSync(currentWaPath, { recursive: true, force: true });
                console.log('[wa] session files cleared after explicit logout.');
              } catch (e) {
                console.error('[wa] failed to delete session path on logout:', e.message);
              }
            }
          }
        }
      } else if (connection === 'open') {
        console.log('[wa] opened connection');
        waStatus = 'linked';
        waQR = '';
        waUser = waSock.user && waSock.user.id ? waSock.user.id.split(':')[0] : '';
        if (eventToSend) eventToSend('wa:status-change', { status: waStatus, user: waUser });
      }
    });
  } catch (err) {
    console.error('[wa] failed to init:', err);
    waStatus = 'disconnected';
    if (eventToSend) eventToSend('wa:status-change', { status: waStatus });
  }
}

async function waDisconnect() {
  await loadBaileys();
  if (waSock) {
    try {
      await waSock.logout();
    } catch (e) {}
    try {
      waSock.end();
    } catch (e) {}
    waSock = null;
  }
  waStatus = 'disconnected';
  waQR = '';
  waUser = '';
  
  var currentWaPath = getWaSessionPath();
  if (fs.existsSync(currentWaPath)) {
    try {
      fs.rmSync(currentWaPath, { recursive: true, force: true });
    } catch (e) {
      console.error('[wa] failed to delete session path:', e.message);
    }
  }
  return { ok: true };
}

async function waSendBill(phone, text, pdfBase64, filename) {
  await loadBaileys();
  if (!waSock || waStatus !== 'linked') {
    throw new Error('WhatsApp not linked');
  }
  var jid = phone.replace(/\D/g, '');
  // CQ-10 Fix: Allow international numbers by checking if the user explicitly provided a country code.
  // If they only provided 10 digits, we assume India (91) as a fallback, but we don't blindly prepend 91 to a 12 digit number.
  if (jid.length === 10) {
    jid = '91' + jid;
  }
  jid = jid + '@s.whatsapp.net';

  var messageOptions = {};
  if (pdfBase64) {
    var buffer = Buffer.from(pdfBase64, 'base64');
    messageOptions = {
      document: buffer,
      mimetype: 'application/pdf',
      fileName: filename || 'Invoice.pdf',
      caption: text
    };
  } else {
    messageOptions = { text: text };
  }

  return waSock.sendMessage(jid, messageOptions);
}


app.on('before-quit', function() {
  if (waSock) {
    try {
      waSock.end();
    } catch (e) {}
    waSock = null;
  }
  require('./crypto/data-encryptor').clearKey();
});

// ── AUTH ──────────────────────────────────────────────────────────────────────
ipcMain.handle('auth:login', function(e, a) {
  return new Promise(function(resolve) {
    require('./supabase/auth').login(a.email, a.password, resolve);
  });
});
ipcMain.handle('auth:logout',    function() { require('./supabase/auth').logout(); return { success: true }; });
ipcMain.handle('auth:isLoggedIn',function() { return require('./supabase/auth').isLoggedIn(); });
ipcMain.handle('auth:session',   function() { return require('./supabase/auth').getSession(); });
ipcMain.handle('auth:refreshSession', function() {
  try {
    require('./supabase/auth').refreshSession();
    return { ok: true };
  } catch(e) {
    return { ok: false, error: e.message };
  }
});
ipcMain.handle('auth:sendResetOTP', function(e, a) {
  return require('./supabase/auth').sendResetOTP(a.email);
});
ipcMain.handle('auth:verifyResetOTP', function(e, a) {
  return require('./supabase/auth').verifyResetOTP(a.email, a.otp);
});
ipcMain.handle('auth:updatePassword', function(e, a) {
  return require('./supabase/auth').updatePassword(a.newPassword);
});

// ── DB MIGRATE (DEPRECATED) ──────────────────────────────────────────────────
// Migrations are handled externally via Supabase SQL scripts (e.g. supabase_security_fix.sql)

// ── SETTINGS ─────────────────────────────────────────────────────────────────
ipcMain.handle('db:settings:get',    function(e, a) { return getModules().settings.getSetting(a.key); });
ipcMain.handle('db:settings:set',    async function(e, a) { 
  await getModules().settings.setSetting(a.key, a.value); 
  try {
    var session = require('./supabase/auth').getSession();
    if (session && session.id) {
      require('./supabase/sync').pushSettingsToSupabase(session.id);
    }
  } catch(err) {}
  return { ok:true }; 
});
ipcMain.handle('db:settings:getAll', function()     { return getModules().settings.getAllSettings(); });
ipcMain.handle('db:settings:setMultiple', async function(e, a) { 
  await getModules().settings.setMultiple(a); 
  try {
    var session = require('./supabase/auth').getSession();
    if (session && session.id) {
      require('./supabase/sync').pushSettingsToSupabase(session.id);
    }
  } catch(err) {}
  return { ok:true }; 
});

ipcMain.on('debug:log', function(e, msg) {
  console.log('[RENDERER DEBUG]', msg);
});

function triggerPushToCloud() {
  try {
    var session = require('./supabase/auth').getSession();
    if (session && session.id) {
      require('./supabase/sync').pushAllLocalDataToSupabase(session.id);
    }
  } catch(e) {}
}

function ensureAuthenticated() {
  var auth = require('./supabase/auth');
  if (!auth.isLoggedIn()) {
    throw new Error('Unauthorized: Authentication required.');
  }
}

// ── CUSTOMERS ─────────────────────────────────────────────────────────────────
safeHandle('db:customers:list',   async function(e, a) { ensureAuthenticated(); return await getModules().customers.listCustomers(a); });
safeHandle('db:customers:get',    async function(e, a) { ensureAuthenticated(); return await getModules().customers.getCustomer(a.id); });
safeHandle('db:customers:create', async function(e, a) { ensureAuthenticated(); var r = await getModules().customers.createCustomer(a); triggerPushToCloud(); return r; });
safeHandle('db:customers:update', async function(e, a) { ensureAuthenticated(); await getModules().customers.updateCustomer(a.id, a.data); triggerPushToCloud(); return { ok:true }; });
safeHandle('db:customers:delete', async function(e, a) { ensureAuthenticated(); await getModules().customers.deleteCustomer(a.id); triggerPushToCloud(); return { ok:true }; });
safeHandle('db:customers:summary',async function(e, a) { ensureAuthenticated(); return await getModules().customers.getCustomerBillSummary(a.id); });

// ── B2B NETWORK BUSINESS LOOKUP ────────────────────────────────────────────────
safeHandle('b2b:lookupBusiness', async function(e, a) {
  ensureAuthenticated();
  var phone = a.phone || '';
  if (!phone || phone.trim().length < 10) return { ok: false, error: 'Enter a valid 10-digit mobile number' };
  
  try {
    var ctx = await require('./supabase/client').ensureAuthenticatedClient();
    var res = await ctx.client.rpc('lookup_billflow_business', { search_phone: phone });
    if (res.error) return { ok: false, error: res.error.message };
    if (res.data && res.data.length > 0) {
      return { ok: true, found: true, business: res.data[0] };
    }
    return { ok: true, found: false };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// ── ITEMS ─────────────────────────────────────────────────────────────────────
safeHandle('db:items:list',   async function(e, a) { ensureAuthenticated(); return await getModules().items.listItems(a); });
safeHandle('db:items:create', async function(e, a) { ensureAuthenticated(); var r = await getModules().items.createItem(a); triggerPushToCloud(); return r; });
safeHandle('db:items:update', async function(e, a) { ensureAuthenticated(); await getModules().items.updateItem(a.id, a.data); triggerPushToCloud(); return { ok:true }; });
safeHandle('db:items:delete', async function(e, a) { ensureAuthenticated(); await getModules().items.deleteItem(a.id); triggerPushToCloud(); return { ok:true }; });

// ── EXPENSES ──────────────────────────────────────────────────────────────────
safeHandle('db:expenses:list',    async function(e, a) { ensureAuthenticated(); return await getModules().expenses.listExpenses(a); });
safeHandle('db:expenses:get',     async function(e, a) { ensureAuthenticated(); return await getModules().expenses.getExpense(a.id); });
safeHandle('db:expenses:create',  async function(e, a) { ensureAuthenticated(); var r = await getModules().expenses.createExpense(a); triggerPushToCloud(); return r; });
safeHandle('db:expenses:update',  async function(e, a) { ensureAuthenticated(); await getModules().expenses.updateExpense(a.id, a.data); triggerPushToCloud(); return { ok:true }; });
safeHandle('db:expenses:delete',  async function(e, a) { ensureAuthenticated(); await getModules().expenses.deleteExpense(a.id); triggerPushToCloud(); return { ok:true }; });
safeHandle('db:expenses:summary', async function(e, a) { ensureAuthenticated(); return await getModules().expenses.getExpenseSummary(a.dateFrom, a.dateTo); });

// ── BILLS ─────────────────────────────────────────────────────────────────────
safeHandle('db:bills:list',         async function(e, a) { ensureAuthenticated(); return await getModules().bills.listBills(a); });
safeHandle('db:bills:get',          async function(e, a) { ensureAuthenticated(); return await getModules().bills.getBill(a.id); });
safeHandle('db:bills:getWithItems', async function(e, a) { ensureAuthenticated(); return await getModules().bills.getBillWithItems(a.id); });
safeHandle('db:bills:create',       async function(e, a) { ensureAuthenticated(); var r = await getModules().bills.createBill(a); triggerPushToCloud(); return r; });
safeHandle('db:bills:update',       async function(e, a) { ensureAuthenticated(); await getModules().bills.updateBill(a.id, a.data); triggerPushToCloud(); return { ok:true }; });
safeHandle('db:bills:updateStatus', async function(e, a) { ensureAuthenticated(); await getModules().bills.updateBillStatus(a.id, a.status, a.payment); triggerPushToCloud(); return { ok:true }; });
safeHandle('db:bills:delete',       async function(e, a) { ensureAuthenticated(); await getModules().bills.deleteBill(a.id); triggerPushToCloud(); return { ok:true }; });
safeHandle('db:bills:counts',       async function()     { ensureAuthenticated(); return await getModules().bills.getBillCountByStatus(); });
safeHandle('db:bills:revenue',      async function(e, a) { ensureAuthenticated(); return await getModules().bills.getMonthlyRevenue(a.months); });
safeHandle('db:bills:dashboard',    async function()     { ensureAuthenticated(); return await getModules().bills.getDashboardSummary(); });

// ── BILL ITEMS ────────────────────────────────────────────────────────────────
safeHandle('db:billitems:replace', async function(e, a) { ensureAuthenticated(); var r = await getModules().billItems.replaceItemsForBill(a.billId, a.items); triggerPushToCloud(); return r; });
safeHandle('db:billitems:get',     async function(e, a) { ensureAuthenticated(); return await getModules().billItems.getItemsForBill(a.billId); });

// ── INBOX BILLS ────────────────────────────────────────────────────────────────
safeHandle('db:inbox:list',             async function(e, a) { ensureAuthenticated(); return await getModules().inbox.listInboxBills(a); });
safeHandle('db:inbox:get',              async function(e, a) { ensureAuthenticated(); return await getModules().inbox.getInboxBill(a.id); });
safeHandle('db:inbox:create',           async function(e, a) { ensureAuthenticated(); var r = await getModules().inbox.createInboxBill(a); triggerPushToCloud(); return r; });
safeHandle('db:inbox:updateStatus',     async function(e, a) { ensureAuthenticated(); await getModules().inbox.updateInboxStatus(a.id, a.status); triggerPushToCloud(); return { ok:true }; });
safeHandle('db:inbox:convertToExpense', async function(e, a) { ensureAuthenticated(); var r = await getModules().inbox.convertToExpense(a.id); triggerPushToCloud(); return r; });
safeHandle('db:inbox:unreadCount',      async function()     { ensureAuthenticated(); return await getModules().inbox.getUnreadCount(); });

// ── TAX RECORDS ───────────────────────────────────────────────────────────────
safeHandle('db:taxrecords:upsert',  async function(e, a) { ensureAuthenticated(); await getModules().taxRecords.upsertTaxRecord(a.billId, a.data); triggerPushToCloud(); return { ok:true }; });
safeHandle('db:creditnotes:list',   async function(e, a) { ensureAuthenticated(); return await getModules().creditNotes.listCreditNotes(a); });
safeHandle('db:creditnotes:create', async function(e, a) { ensureAuthenticated(); var r = await getModules().creditNotes.createCreditNote(a); triggerPushToCloud(); return r; });

safeHandle('db:export:fullData', async function() {
  ensureAuthenticated();
  var m = getModules();
  var customers = await m.customers.listCustomers();
  var items     = await m.items.listItems();
  var bills     = await m.bills.listBills();
  var expenses  = await m.expenses.listExpenses();
  var settings  = m.settings.getAllSettings();

  return {
    exported_at: new Date().toISOString(),
    version: '1.0.0',
    settings: settings,
    customers: customers,
    items: items,
    bills: bills,
    expenses: expenses
  };
});
safeHandle('db:taxrecords:summary', async function(e, a) { return await getModules().taxRecords.getTaxSummary(a); });
safeHandle('db:taxrecords:monthly', async function(e, a) { return await getModules().taxRecords.getMonthlyGSTSummary(a.year); });
safeHandle('gst:gstr1Export', function(e, a) { return require('./gst/gstr1-export').exportGSTR1(a.year, a.month); });
safeHandle('gst:fetchDetails', function(e, a) { return require('./gst/lookup').fetchDetails(a.gstin); });
safeHandle('gst:cacheBulk', function(e, a) { return require('./gst/lookup').cacheBulk(a.records); });


// ── SYNC ──────────────────────────────────────────────────────────────────────
ipcMain.handle('sync:now', function() {
  return new Promise(function(resolve) {
    var sync = require('./supabase/sync');
    sync.isOnline(function(online) {
      if (online) {
        var session = null;
        try { session = require('./supabase/auth').getSession(); } catch(e) {}
        if (session && session.id) {
          sync.pushAllLocalDataToSupabase(session.id, function() {
            sync.pullDataFromSupabase(session.id);
            var settings = require('./db/queries/settings');
            settings.setSetting('last_sync_at', new Date().toISOString());
            resolve({ success: true, online: true });
          });
        } else {
          sync.flushSyncQueue();
          resolve({ success: true, online: true });
        }
      } else {
        resolve({ success: false, online: false });
      }
    });
  });
});

ipcMain.handle('db:sync:pending',   function() { return getModules().syncQueue.getPendingCount(); });

// ── PDF ───────────────────────────────────────────────────────────────────────
ipcMain.handle('pdf:generate', function(e, a) {
  return getModules().pdf.generateBillPDF(a);
});

// ── BILL NUMBER ───────────────────────────────────────────────────────────────
ipcMain.handle('bills:nextNumber',   function() { return getModules().billNum.getNextBillNumber(); });
ipcMain.handle('bills:incrementNum', async function() { await getModules().billNum.incrementBillNumber(); return { ok:true }; });

// ── WEBHOOKS ──────────────────────────────────────────────────────────────────
ipcMain.handle('webhook:billSent', function(e, a) {
  var m = getModules();
  m.webhooks.billSent(a.bill, a.customer, a.items, a.taxRecord, a.pdfBase64, a.channels);
  return { ok: true };
});
ipcMain.handle('webhook:paymentReminder', function(e, a) {
  var m = getModules();
  m.webhooks.paymentReminder(a.bill, a.customer, a.items, a.taxRecord, a.pdfBase64, a.channels);
  return { ok: true };
});
ipcMain.handle('webhook:settingsUpdated', function(e, a) {
  getModules().webhooks.settingsUpdated(a);
  return { ok: true };
});

ipcMain.handle('shell:openExternal', function(e, a) {
  if (a.url && (a.url.startsWith('http://') || a.url.startsWith('https://') || a.url.startsWith('whatsapp://'))) {
    require('electron').shell.openExternal(a.url);
    return { ok: true };
  }
  return { ok: false, error: 'Invalid URL scheme' };
});

// ── LOCAL WHATSAPP ────────────────────────────────────────────────────────────
ipcMain.handle('wa:getStatus', function() {
  return { status: waStatus, qr: waQR, user: waUser };
});

ipcMain.handle('wa:connect', function() {
  initWhatsApp(function(channel, arg) {
    if (mainWindow) mainWindow.webContents.send(channel, arg);
  });
  return { status: waStatus, qr: waQR, user: waUser };
});

ipcMain.handle('wa:disconnect', function() {
  return waDisconnect().then(function(res) {
    if (mainWindow) mainWindow.webContents.send('wa:status-change', { status: 'disconnected' });
    return res;
  });
});

ipcMain.handle('wa:sendBill', function(e, a) {
  return waSendBill(a.phone, a.text, a.pdfBase64, a.filename).then(function() {
    return { ok: true };
  });
});

// ── OTA AUTO-UPDATER ─────────────────────────────────────────────────────────
function setupAutoUpdater() {
  autoUpdater.on('checking-for-update', function() {
    if (mainWindow) mainWindow.webContents.send('updater:status', { status: 'checking', message: 'Checking for OTA updates...' });
  });

  autoUpdater.on('update-available', function(info) {
    if (mainWindow) mainWindow.webContents.send('updater:status', { status: 'available', info: info, message: 'New update (v' + (info && info.version) + ') available! Downloading in background...' });
  });

  autoUpdater.on('update-not-available', function(info) {
    if (mainWindow) mainWindow.webContents.send('updater:status', { status: 'not-available', info: info, message: 'Satya BillFlow is up to date.' });
  });

  autoUpdater.on('error', function(err) {
    console.error('[OTA Updater] Error:', err);
    if (mainWindow) mainWindow.webContents.send('updater:status', { status: 'error', error: err ? err.message : 'Update error', message: 'Update check completed.' });
  });

  autoUpdater.on('download-progress', function(progressObj) {
    if (mainWindow) mainWindow.webContents.send('updater:status', { status: 'downloading', progress: progressObj, message: 'Downloading update (' + Math.round(progressObj.percent) + '%)...' });
  });

  autoUpdater.on('update-downloaded', function(info) {
    if (mainWindow) mainWindow.webContents.send('updater:status', { status: 'downloaded', info: info, message: 'New update (v' + (info && info.version) + ') ready! Click to restart & apply.' });
  });
}

ipcMain.handle('updater:check', function() {
  return autoUpdater.checkForUpdatesAndNotify().then(function(res) {
    return { ok: true, res: res };
  }).catch(function(err) {
    return { ok: false, error: err ? err.message : 'Failed to check' };
  });
});

ipcMain.handle('updater:quitAndInstall', function() {
  autoUpdater.quitAndInstall();
  return { ok: true };
});



