var electron      = require('electron');
var app           = electron.app;
var BrowserWindow = electron.BrowserWindow;
var ipcMain       = electron.ipcMain;
var path          = require('path');

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

app.on('ready', function() {
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
  mainWindow.once('ready-to-show', function() { mainWindow.show(); });
});

app.on('before-quit', function() {
  require('./db/connection').closeDB();
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

// ── DB MIGRATE (called after login) ──────────────────────────────────────────
ipcMain.handle('db:migrate', function() {
  require('./db/migrate').runMigrations();
  return { ok: true };
});

// ── SETTINGS ─────────────────────────────────────────────────────────────────
ipcMain.handle('db:settings:get',    function(e, a) { return getModules().settings.getSetting(a.key); });
ipcMain.handle('db:settings:set',    function(e, a) { getModules().settings.setSetting(a.key, a.value); return { ok:true }; });
ipcMain.handle('db:settings:getAll', function()     { return getModules().settings.getAllSettings(); });
ipcMain.handle('db:settings:setMultiple', function(e, a) { getModules().settings.setMultiple(a); return { ok:true }; });

// ── CUSTOMERS ─────────────────────────────────────────────────────────────────
ipcMain.handle('db:customers:list',   function(e, a) { return getModules().customers.listCustomers(a); });
ipcMain.handle('db:customers:get',    function(e, a) { return getModules().customers.getCustomer(a.id); });
ipcMain.handle('db:customers:create', function(e, a) { return getModules().customers.createCustomer(a); });
ipcMain.handle('db:customers:update', function(e, a) { getModules().customers.updateCustomer(a.id, a.data); return { ok:true }; });
ipcMain.handle('db:customers:delete', function(e, a) { getModules().customers.deleteCustomer(a.id); return { ok:true }; });
ipcMain.handle('db:customers:summary',function(e, a) { return getModules().customers.getCustomerBillSummary(a.id); });

// ── ITEMS ─────────────────────────────────────────────────────────────────────
ipcMain.handle('db:items:list',   function(e, a) { return getModules().items.listItems(a); });
ipcMain.handle('db:items:create', function(e, a) { return getModules().items.createItem(a); });
ipcMain.handle('db:items:update', function(e, a) { getModules().items.updateItem(a.id, a.data); return { ok:true }; });
ipcMain.handle('db:items:delete', function(e, a) { getModules().items.deleteItem(a.id); return { ok:true }; });

// ── BILLS ─────────────────────────────────────────────────────────────────────
ipcMain.handle('db:bills:list',         function(e, a) { return getModules().bills.listBills(a); });
ipcMain.handle('db:bills:get',          function(e, a) { return getModules().bills.getBill(a.id); });
ipcMain.handle('db:bills:getWithItems', function(e, a) { return getModules().bills.getBillWithItems(a.id); });
ipcMain.handle('db:bills:create',       function(e, a) { return getModules().bills.createBill(a); });
ipcMain.handle('db:bills:update',       function(e, a) { getModules().bills.updateBill(a.id, a.data); return { ok:true }; });
ipcMain.handle('db:bills:updateStatus', function(e, a) { getModules().bills.updateBillStatus(a.id, a.status, a.payment); return { ok:true }; });
ipcMain.handle('db:bills:delete',       function(e, a) { getModules().bills.deleteBill(a.id); return { ok:true }; });
ipcMain.handle('db:bills:counts',       function()     { return getModules().bills.getBillCountByStatus(); });
ipcMain.handle('db:bills:revenue',      function(e, a) { return getModules().bills.getMonthlyRevenue(a.months); });
ipcMain.handle('db:bills:dashboard',    function()     { return getModules().bills.getDashboardSummary(); });

// ── BILL ITEMS ────────────────────────────────────────────────────────────────
ipcMain.handle('db:billitems:replace', function(e, a) { return getModules().billItems.replaceItemsForBill(a.billId, a.items); });

// ── TAX RECORDS ───────────────────────────────────────────────────────────────
ipcMain.handle('db:taxrecords:upsert',  function(e, a) { getModules().taxRecords.upsertTaxRecord(a.billId, a.data); return { ok:true }; });
ipcMain.handle('db:taxrecords:summary', function(e, a) { return getModules().taxRecords.getTaxSummary(a); });
ipcMain.handle('db:taxrecords:monthly', function(e, a) { return getModules().taxRecords.getMonthlyGSTSummary(a.year); });
ipcMain.handle('gst:gstr1Export', function(e, a) { return require('./gst/gstr1-export').exportGSTR1(a.year, a.month); });
ipcMain.handle('gst:fetchDetails', function(e, a) { return require('./gst/lookup').fetchDetails(a.gstin); });


// ── SYNC ──────────────────────────────────────────────────────────────────────
ipcMain.handle('sync:now', function() {
  var syncQueue = require('./db/queries/sync-queue');
  var pending = syncQueue.getPendingQueue();
  if (pending.length > 0) {
    var webhooks = require('./n8n/webhooks');
    webhooks.syncPush(pending);
  }
  return { pending: pending.length };
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
ipcMain.handle('webhook:settingsUpdated', function(e, a) {
  getModules().webhooks.settingsUpdated(a);
  return { ok: true };
});
