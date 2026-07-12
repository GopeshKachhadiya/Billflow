var fs   = require('fs');
var path = require('path');
var conn = require('./connection');

function runMigrations() {
  var db = conn.getDB();

  // Check if already migrated
  var exists = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='settings'"
  ).get();

  if (!exists) {
    var sqlPath = path.join(__dirname, 'migrations', '001_initial.sql');
    var sql     = fs.readFileSync(sqlPath, 'utf8');
    db.exec(sql);
    console.log('[migrate] Database created and initialised');
  } else {
    console.log('[migrate] Database already exists — skipping');
  }

  // Ensure users_local table has status and trial_end_date columns for older setups
  try {
    db.prepare("ALTER TABLE users_local ADD COLUMN status TEXT").run();
  } catch (e) {}
  try {
    db.prepare("ALTER TABLE users_local ADD COLUMN trial_end_date TEXT").run();
  } catch (e) {}

  // Ensure bill_items has lot_no, grade, and cartons columns for yarn invoice layout
  try {
    db.prepare("ALTER TABLE bill_items ADD COLUMN lot_no TEXT").run();
  } catch (e) {}
  try {
    db.prepare("ALTER TABLE bill_items ADD COLUMN grade TEXT").run();
  } catch (e) {}
  try {
    db.prepare("ALTER TABLE bill_items ADD COLUMN cartons REAL").run();
  } catch (e) {}

  // Ensure gstin_cache table exists in local SQLite database
  try {
    db.exec(
      'CREATE TABLE IF NOT EXISTS gstin_cache (' +
      '  gstin           TEXT PRIMARY KEY,' +
      '  name            TEXT NOT NULL,' +
      '  type            TEXT DEFAULT "Business",' +
      '  state           TEXT DEFAULT "",' +
      '  state_code      TEXT DEFAULT "",' +
      '  billing_address TEXT DEFAULT "",' +
      '  billing_city    TEXT DEFAULT "",' +
      '  billing_pin     TEXT DEFAULT "",' +
      '  status          TEXT DEFAULT "Active",' +
      '  created_at      TEXT DEFAULT (datetime("now")),' +
      '  updated_at      TEXT DEFAULT (datetime("now"))' +
      ');'
    );
  } catch (e) {
    console.error('[migrate] Failed to create gstin_cache local table:', e.message);
  }
}

module.exports = { runMigrations: runMigrations };
