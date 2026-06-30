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
}

module.exports = { runMigrations: runMigrations };
