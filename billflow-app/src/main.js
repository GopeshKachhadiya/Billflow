var electron      = require('electron');
var app           = electron.app;
var BrowserWindow = electron.BrowserWindow;
var ipcMain       = electron.ipcMain;
var path          = require('path');
var fs            = require('fs');
var autoUpdater   = require('electron-updater').autoUpdater;

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

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

var waSessionPath = path.join(app.getPath('userData'), 'wa-session');


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
    encryptor:  require('./crypto/data-encryptor')
  };
}

var mainWindow = null;

function syncEnvToSettings() {
  try {
    var fs = require('fs');
    var path = require('path');
    var envPaths = [
      path.join(__dirname, '..', '.env'),
      path.join(__dirname, '../..', '.env'),
      path.join(__dirname, '..', 'billadmin', '.env'),
      path.join(__dirname, '../../billadmin', '.env')
    ];
    var envPath = null;
    for (var i = 0; i < envPaths.length; i++) {
      if (fs.existsSync(envPaths[i])) { envPath = envPaths[i]; break; }
    }
    if (envPath && fs.existsSync(envPath)) {
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

  mainWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 800, minHeight: 600,
    title: 'BillFlow', show: false,
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      nodeIntegration:  false,
      contextIsolation: true
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
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

    // Auto-connect WhatsApp if credentials exist and are linked
    var credsPath = path.join(waSessionPath, 'creds.json');
    if (fs.existsSync(credsPath)) {
      try {
        var creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
        if (creds && creds.me) {
          initWhatsApp(function(channel, arg) {
            if (mainWindow) mainWindow.webContents.send(channel, arg);
          });
        }
      } catch (e) {
        console.error('[wa] failed to read creds.json on startup:', e);
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
    var auth = await useMultiFileAuthState(waSessionPath);
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
        var shouldReconnect = !isLoggedOut && !isBadSession;
        
        console.log('[wa] connection closed due to ', lastDisconnect && lastDisconnect.error, ', reconnecting ', shouldReconnect);
        waSock = null;
        waQR = '';
        waUser = '';
        
        if (shouldReconnect) {
          waStatus = 'connecting';
          if (eventToSend) eventToSend('wa:status-change', { status: waStatus });
          // Throttled reconnect to avoid infinite loop CPU spikes during network outages
          setTimeout(function() {
            initWhatsApp(eventToSend);
          }, 5000);
        } else {
          waStatus = 'disconnected';
          if (eventToSend) eventToSend('wa:status-change', { status: waStatus });
          // Clear session files if explicitly logged out or session is bad/corrupted
          if (fs.existsSync(waSessionPath)) {
            try {
              fs.rmSync(waSessionPath, { recursive: true, force: true });
            } catch (e) {
              console.error('[wa] failed to delete session path on close:', e.message);
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
  
  if (fs.existsSync(waSessionPath)) {
    try {
      fs.rmSync(waSessionPath, { recursive: true, force: true });
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
  if (jid.length === 10) jid = '91' + jid;
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

// ── DB MIGRATE (called after login) ──────────────────────────────────────────
ipcMain.handle('db:migrate', function() {
  return { ok: true };
});

// ── SETTINGS ─────────────────────────────────────────────────────────────────
ipcMain.handle('db:settings:get',    function(e, a) { return getModules().settings.getSetting(a.key); });
ipcMain.handle('db:settings:set',    function(e, a) { 
  getModules().settings.setSetting(a.key, a.value); 
  try {
    var session = require('./supabase/auth').getSession();
    if (session && session.id) {
      require('./supabase/sync').pushSettingsToSupabase(session.id);
    }
  } catch(err) {}
  return { ok:true }; 
});
ipcMain.handle('db:settings:getAll', function()     { return getModules().settings.getAllSettings(); });
ipcMain.handle('db:settings:setMultiple', function(e, a) { 
  getModules().settings.setMultiple(a); 
  try {
    var session = require('./supabase/auth').getSession();
    if (session && session.id) {
      require('./supabase/sync').pushSettingsToSupabase(session.id);
    }
  } catch(err) {}
  return { ok:true }; 
});

function triggerPushToCloud() {
  try {
    var session = require('./supabase/auth').getSession();
    if (session && session.id) {
      require('./supabase/sync').pushAllLocalDataToSupabase(session.id);
    }
  } catch(e) {}
}

// ── CUSTOMERS ─────────────────────────────────────────────────────────────────
ipcMain.handle('db:customers:list',   async function(e, a) { return await getModules().customers.listCustomers(a); });
ipcMain.handle('db:customers:get',    async function(e, a) { return await getModules().customers.getCustomer(a.id); });
ipcMain.handle('db:customers:create', async function(e, a) { var r = await getModules().customers.createCustomer(a); triggerPushToCloud(); return r; });
ipcMain.handle('db:customers:update', async function(e, a) { await getModules().customers.updateCustomer(a.id, a.data); triggerPushToCloud(); return { ok:true }; });
ipcMain.handle('db:customers:delete', async function(e, a) { await getModules().customers.deleteCustomer(a.id); triggerPushToCloud(); return { ok:true }; });
ipcMain.handle('db:customers:summary',async function(e, a) { return await getModules().customers.getCustomerBillSummary(a.id); });

// ── ITEMS ─────────────────────────────────────────────────────────────────────
ipcMain.handle('db:items:list',   async function(e, a) { return await getModules().items.listItems(a); });
ipcMain.handle('db:items:create', async function(e, a) { var r = await getModules().items.createItem(a); triggerPushToCloud(); return r; });
ipcMain.handle('db:items:update', async function(e, a) { await getModules().items.updateItem(a.id, a.data); triggerPushToCloud(); return { ok:true }; });
ipcMain.handle('db:items:delete', async function(e, a) { await getModules().items.deleteItem(a.id); triggerPushToCloud(); return { ok:true }; });

// ── BILLS ─────────────────────────────────────────────────────────────────────
ipcMain.handle('db:bills:list',         async function(e, a) { return await getModules().bills.listBills(a); });
ipcMain.handle('db:bills:get',          async function(e, a) { return await getModules().bills.getBill(a.id); });
ipcMain.handle('db:bills:getWithItems', async function(e, a) { return await getModules().bills.getBillWithItems(a.id); });
ipcMain.handle('db:bills:create',       async function(e, a) { var r = await getModules().bills.createBill(a); triggerPushToCloud(); return r; });
ipcMain.handle('db:bills:update',       async function(e, a) { await getModules().bills.updateBill(a.id, a.data); triggerPushToCloud(); return { ok:true }; });
ipcMain.handle('db:bills:updateStatus', async function(e, a) { await getModules().bills.updateBillStatus(a.id, a.status, a.payment); triggerPushToCloud(); return { ok:true }; });
ipcMain.handle('db:bills:delete',       async function(e, a) { await getModules().bills.deleteBill(a.id); triggerPushToCloud(); return { ok:true }; });
ipcMain.handle('db:bills:counts',       async function()     { return await getModules().bills.getBillCountByStatus(); });
ipcMain.handle('db:bills:revenue',      async function(e, a) { return await getModules().bills.getMonthlyRevenue(a.months); });
ipcMain.handle('db:bills:dashboard',    async function()     { return await getModules().bills.getDashboardSummary(); });

// ── BILL ITEMS ────────────────────────────────────────────────────────────────
ipcMain.handle('db:billitems:replace', async function(e, a) { var r = await getModules().billItems.replaceItemsForBill(a.billId, a.items); triggerPushToCloud(); return r; });
ipcMain.handle('db:billitems:get',     async function(e, a) { return await getModules().billItems.getItemsForBill(a.billId); });

// ── TAX RECORDS ───────────────────────────────────────────────────────────────
ipcMain.handle('db:taxrecords:upsert',  async function(e, a) { await getModules().taxRecords.upsertTaxRecord(a.billId, a.data); triggerPushToCloud(); return { ok:true }; });
ipcMain.handle('db:taxrecords:get',     async function(e, a) { return await getModules().taxRecords.getTaxRecord(a.billId); });
ipcMain.handle('db:taxrecords:summary', async function(e, a) { return await getModules().taxRecords.getTaxSummary(a); });
ipcMain.handle('db:taxrecords:monthly', async function(e, a) { return await getModules().taxRecords.getMonthlyGSTSummary(a.year); });
ipcMain.handle('gst:gstr1Export', function(e, a) { return require('./gst/gstr1-export').exportGSTR1(a.year, a.month); });
ipcMain.handle('gst:fetchDetails', function(e, a) { return require('./gst/lookup').fetchDetails(a.gstin); });
ipcMain.handle('gst:cacheBulk', function(e, a) { return require('./gst/lookup').cacheBulk(a.records); });


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
ipcMain.handle('bills:incrementNum', function() { getModules().billNum.incrementBillNumber(); return { ok:true }; });

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
    if (mainWindow) mainWindow.webContents.send('updater:status', { status: 'not-available', info: info, message: 'BillFlow is up to date.' });
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



