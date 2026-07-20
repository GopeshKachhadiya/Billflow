const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const desktopFiles = [
  'src/main.js',
  'src/preload.js',
  'src/db/connection.js',
  'src/db/migrate.js',
  'src/db/migrations/001_initial.sql',
  'src/db/queries/settings.js',
  'src/db/queries/sync-queue.js',
  'src/db/queries/customers.js',
  'src/db/queries/items.js',
  'src/db/queries/bills.js',
  'src/db/queries/bill-items.js',
  'src/db/queries/tax-records.js',
  'src/crypto/key-derivation.js',
  'src/crypto/data-encryptor.js',
  'src/gst/calculator.js',
  'src/gst/amount-to-words.js',
  'src/gst/validators.js',
  'src/gst/gstr1-export.js',
  'src/gst/lookup.js',
  'src/gst/test-calculator.js',
  'src/supabase/client.js',
  'src/supabase/auth.js',
  'src/supabase/sync.js',
  'src/n8n/webhooks.js',
  'src/utils/bill-number.js',
  'src/utils/date.js',
  'src/utils/format-currency.js',
  'src/utils/state-codes.js',
  'src/pdf/generator.js',
  'src/renderer/app.js',
  'src/renderer/index.html',
  'src/renderer/styles-modern.css',
  'src/renderer/styles-legacy.css',
  
  // HTML Views
  'src/renderer/pages/login.html',
  'src/renderer/pages/dashboard.html',
  'src/renderer/pages/bills-list.html',
  'src/renderer/pages/bill-edit.html',
  'src/renderer/pages/bill-view.html',
  'src/renderer/pages/customers-list.html',
  'src/renderer/pages/customer-edit.html',
  'src/renderer/pages/catalog-list.html',
  'src/renderer/pages/reports.html',
  'src/renderer/pages/settings.html',
  
  // JS Controllers
  'src/renderer/js/pages/login.js',
  'src/renderer/js/pages/dashboard.js',
  'src/renderer/js/pages/bills-list.js',
  'src/renderer/js/pages/bill-edit.js',
  'src/renderer/js/pages/bill-view.js',
  'src/renderer/js/pages/customers-list.js',
  'src/renderer/js/pages/customer-edit.js',
  'src/renderer/js/pages/catalog-list.js',
  'src/renderer/js/pages/reports.js',
  'src/renderer/js/pages/settings.js',
  
  // Vendor copies
  'src/renderer/js/vendor/amount-to-words.js',
  'src/renderer/js/vendor/date-utils.js',
  'src/renderer/js/vendor/format-currency.js',
  'src/renderer/js/vendor/gst-calculator.js',
  'src/renderer/js/vendor/state-codes.js',
];

const adminFiles = [
  'billadmin/vite.config.js',
  'billadmin/index.html',
  'billadmin/tailwind.config.js',
  'billadmin/src/main.jsx',
  'billadmin/src/App.jsx',
  'billadmin/src/styles/index.css',
  
  // Pages
  'billadmin/src/pages/Login.jsx',
  'billadmin/src/pages/Dashboard.jsx',
  'billadmin/src/pages/Users.jsx',
  'billadmin/src/pages/UserDetail.jsx',
  'billadmin/src/pages/AddUser.jsx',
  'billadmin/src/pages/Trials.jsx',
  'billadmin/src/pages/Analytics.jsx',
  'billadmin/src/pages/Billing.jsx',
  'billadmin/src/pages/ActivityLogs.jsx',
  
  // Components
  'billadmin/src/components/layout/AppLayout.jsx',
  'billadmin/src/components/layout/Sidebar.jsx',
  'billadmin/src/components/layout/Topbar.jsx',
  'billadmin/src/components/ui/KPICard.jsx',
  'billadmin/src/components/ui/StatusBadge.jsx',
  
  // Hooks
  'billadmin/src/hooks/useUsers.js',
  'billadmin/src/hooks/usePayments.js',
  'billadmin/src/hooks/useStats.js',
  'billadmin/src/hooks/useActivityLog.js',
];

console.log('--- SCANNING WORKSPACE FILES ---');
const report = {
  existing: [],
  missing: [],
  emptyOrTiny: [],
  todos: []
};

function auditFileList(fileList) {
  for (const relPath of fileList) {
    const absPath = path.join(rootDir, relPath);
    if (!fs.existsSync(absPath)) {
      report.missing.push(relPath);
      continue;
    }
    
    const stats = fs.statSync(absPath);
    const content = fs.readFileSync(absPath, 'utf8');
    const lines = content.split('\n');
    
    report.existing.push({
      path: relPath,
      size: stats.size,
      lines: lines.length
    });
    
    if (stats.size < 10 || lines.length < 3) {
      report.emptyOrTiny.push({ path: relPath, size: stats.size, lines: lines.length });
    }
    
    if (/TODO|FIXME|PLACEHOLDER/i.test(content)) {
      const matches = [];
      lines.forEach((line, idx) => {
        if (/TODO|FIXME|PLACEHOLDER/i.test(line)) {
          matches.push(`Line ${idx + 1}: ${line.trim()}`);
        }
      });
      report.todos.push({ path: relPath, matches });
    }
  }
}

auditFileList(desktopFiles);
auditFileList(adminFiles);

console.log(`\nFound ${report.existing.length} files on disk.`);
console.log(`Missing ${report.missing.length} files.`);
if (report.missing.length > 0) {
  console.log('MISSING FILES:');
  report.missing.forEach(p => console.log(` - ${p}`));
}

if (report.emptyOrTiny.length > 0) {
  console.log('\nEMPTY OR TINY FILES (Potential placeholders):');
  report.emptyOrTiny.forEach(f => console.log(` - ${f.path} (${f.size} bytes, ${f.lines} lines)`));
}

if (report.todos.length > 0) {
  console.log('\nFILES CONTAINING TODO/FIXME/PLACEHOLDER:');
  report.todos.forEach(t => {
    console.log(` - ${t.path}:`);
    t.matches.forEach(m => console.log(`     ${m}`));
  });
}
