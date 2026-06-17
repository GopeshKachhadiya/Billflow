var conn = require('../connection');

function getSetting(key) {
  var row = conn.getDB()
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  conn.getDB()
    .prepare(
      "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) " +
      "ON CONFLICT(key) DO UPDATE SET value = excluded.value, " +
      "updated_at = datetime('now')"
    )
    .run(key, value === null || value === undefined ? '' : String(value));
}

function getAllSettings() {
  var rows   = conn.getDB().prepare('SELECT key, value FROM settings').all();
  var result = {};
  for (var i = 0; i < rows.length; i++) {
    result[rows[i].key] = rows[i].value;
  }
  return result;
}

function setMultiple(obj) {
  var db   = conn.getDB();
  var stmt = db.prepare(
    "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) " +
    "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')"
  );
  var tx = db.transaction(function() {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        stmt.run(key, String(obj[key]));
      }
    }
  });
  tx();
}

module.exports = {
  getSetting:   getSetting,
  setSetting:   setSetting,
  getAllSettings: getAllSettings,
  setMultiple:  setMultiple
};
