var contextBridge = require('electron').contextBridge;
var ipcRenderer   = require('electron').ipcRenderer;

function ipc(channel, args) { return ipcRenderer.invoke(channel, args || {}); }

contextBridge.exposeInMainWorld('api', {
  // Auth
  login:          function(e, p)     { return ipc('auth:login',          { email:e, password:p }); },
  logout:         function()         { return ipc('auth:logout',         {}); },
  isLoggedIn:     function()         { return ipc('auth:isLoggedIn',     {}); },
  getSession:     function()         { return ipc('auth:session',        {}); },
  refreshSession: function()         { return ipc('auth:refreshSession', {}); },
  sendResetOTP:   function(email)    { return ipc('auth:sendResetOTP',   { email:email }); },
  verifyResetOTP: function(e, otp)   { return ipc('auth:verifyResetOTP', { email:e, otp:otp }); },
  updatePassword: function(pass)     { return ipc('auth:updatePassword', { newPassword:pass }); },

  // DB migrate
  migrate:     function()        { return ipc('db:migrate',    {}); },

  // Settings
  getSetting:          function(k)    { return ipc('db:settings:get',         { key:k }); },
  setSetting:          function(k, v) { return ipc('db:settings:set',         { key:k, value:v }); },
  getAllSettings:       function()     { return ipc('db:settings:getAll',      {}); },
  setMultipleSettings: function(obj)  { return ipc('db:settings:setMultiple', obj); },

  // Customers
  listCustomers:          function(f)       { return ipc('db:customers:list',    f    || {}); },
  getCustomer:            function(id)      { return ipc('db:customers:get',     { id:id }); },
  createCustomer:         function(d)       { return ipc('db:customers:create',  d); },
  updateCustomer:         function(id, d)   { return ipc('db:customers:update',  { id:id, data:d }); },
  deleteCustomer:         function(id)      { return ipc('db:customers:delete',  { id:id }); },
  getCustomerBillSummary: function(id)      { return ipc('db:customers:summary', { id:id }); },
  lookupBillflowBusiness: function(phone)   { return ipc('b2b:lookupBusiness',   { phone:phone }); },

  // Items
  listItems:   function(f)       { return ipc('db:items:list',    f || {}); },
  createItem:  function(d)       { return ipc('db:items:create',  d); },
  updateItem:  function(id, d)   { return ipc('db:items:update',  { id:id, data:d }); },
  deleteItem:  function(id)      { return ipc('db:items:delete',  { id:id }); },

  // Expenses
  listExpenses:      function(f)     { return ipc('db:expenses:list',    f || {}); },
  getExpense:        function(id)    { return ipc('db:expenses:get',     { id:id }); },
  createExpense:     function(d)     { return ipc('db:expenses:create',  d); },
  updateExpense:     function(id, d) { return ipc('db:expenses:update',  { id:id, data:d }); },
  deleteExpense:     function(id)    { return ipc('db:expenses:delete',  { id:id }); },
  getExpenseSummary: function(f)     { return ipc('db:expenses:summary', f || {}); },

  // Credit Notes & Backup
  listCreditNotes:  function(f)     { return ipc('db:creditnotes:list',   f || {}); },
  createCreditNote: function(d)     { return ipc('db:creditnotes:create', d); },
  exportFullData:   function()      { return ipc('db:export:fullData',    {}); },

  // Incoming Bills Inbox
  listInboxBills:       function(f)       { return ipc('db:inbox:list',             f || {}); },
  getInboxBill:         function(id)      { return ipc('db:inbox:get',              { id:id }); },
  createInboxBill:      function(d)       { return ipc('db:inbox:create',           d); },
  updateInboxStatus:    function(id, s)   { return ipc('db:inbox:updateStatus',     { id:id, status:s }); },
  convertInboxToExpense:function(id)      { return ipc('db:inbox:convertToExpense', { id:id }); },
  getInboxUnreadCount:  function()        { return ipc('db:inbox:unreadCount',      {}); },

  // Bills
  listBills:           function(f)       { return ipc('db:bills:list',         f || {}); },
  getBill:             function(id)      { return ipc('db:bills:get',           { id:id }); },
  getBillWithItems:    function(id)      { return ipc('db:bills:getWithItems',  { id:id }); },
  createBill:          function(d)       { return ipc('db:bills:create',        d); },
  updateBill:          function(id, d)   { return ipc('db:bills:update',        { id:id, data:d }); },
  updateBillStatus:    function(id, s, p){ return ipc('db:bills:updateStatus',  { id:id, status:s, payment:p }); },
  deleteBill:          function(id)      { return ipc('db:bills:delete',        { id:id }); },
  getBillCounts:       function()        { return ipc('db:bills:counts',        {}); },
  getMonthlyRevenue:   function(m)       { return ipc('db:bills:revenue',       { months:m }); },
  getDashboardSummary: function()        { return ipc('db:bills:dashboard',     {}); },

  // Bill items
  replaceBillItems: function(billId, items) { return ipc('db:billitems:replace', { billId:billId, items:items }); },
  getBillItems:     function(billId)        { return ipc('db:billitems:get',     { billId:billId }); },

  // Tax records
  upsertTaxRecord: function(billId, d) { return ipc('db:taxrecords:upsert',  { billId:billId, data:d }); },
  getTaxRecord:    function(billId)    { return ipc('db:taxrecords:get',     { billId:billId }); },
  getTaxSummary:   function(f)         { return ipc('db:taxrecords:summary', f || {}); },
  getMonthlyGST:   function(year)      { return ipc('db:taxrecords:monthly', { year:year }); },
  exportGSTR1:     function(year, month) { return ipc('gst:gstr1Export', { year:year, month:month }); },
  fetchGSTINDetails: function(gstin) { return ipc('gst:fetchDetails', { gstin: gstin }); },
  cacheGSTINBulk:    function(records) { return ipc('gst:cacheBulk', { records: records }); },


  // Sync
  syncNow:             function()  { return ipc('sync:now',        {}); },
  getPendingSyncCount: function()  { return ipc('db:sync:pending', {}); },

  // PDF
  generatePDF: function(data) { return ipc('pdf:generate', data); },

  // Bill number
  getNextBillNumber:  function()  { return ipc('bills:nextNumber',   {}); },
  incrementBillNumber:function()  { return ipc('bills:incrementNum', {}); },

  // Webhooks
  billSent:         function(b, c, items, tax, pdf, channels) {
    return ipc('webhook:billSent', { bill:b, customer:c, items:items, taxRecord:tax, pdfBase64:pdf, channels:channels });
  },
  paymentReminder:  function(b, c, items, tax, pdf, channels) {
    return ipc('webhook:paymentReminder', { bill:b, customer:c, items:items, taxRecord:tax, pdfBase64:pdf, channels:channels });
  },
  settingsUpdated:  function(s) { return ipc('webhook:settingsUpdated', s); },
  testN8nWebhook:   function(url) { return ipc('n8n:testWebhook', { url: url }); },
  openExternal:     function(url) { return ipc('shell:openExternal', { url:url }); },
  
  // Local WhatsApp
  waGetStatus:      function() { return ipc('wa:getStatus', {}); },
  waConnect:        function() { return ipc('wa:connect', {}); },
  waDisconnect:     function() { return ipc('wa:disconnect', {}); },
  waSendBill:       function(phone, text, pdf, filename) { return ipc('wa:sendBill', { phone:phone, text:text, pdfBase64:pdf, filename:filename }); },
  onWaStatusChange: function(callback) {
    var subscription = function(event, value) { callback(value); };
    ipcRenderer.on('wa:status-change', subscription);
    return function() {
      ipcRenderer.removeListener('wa:status-change', subscription);
    };
  },

  // OTA Auto-Updater & Version
  getVersion:      function() { return ipc('app:getVersion', {}); },
  checkForUpdates: function() { return ipc('updater:check', {}); },
  quitAndInstall:  function() { return ipc('updater:quitAndInstall', {}); },
  onUpdateStatus:  function(callback) {
    var subscription = function(event, data) { callback(data); };
    ipcRenderer.on('updater:status', subscription);
    return function() {
      ipcRenderer.removeListener('updater:status', subscription);
    };
  },

  // Debugging
  debugLog: function(msg) { ipcRenderer.send('debug:log', msg); }
});
