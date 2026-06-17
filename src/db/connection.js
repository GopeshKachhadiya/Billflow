var path = require('path');
var Database = require('better-sqlite3');

var db = null;
var dbKey = null;

function getDBPath() {
  if (process.type === 'renderer') {
    throw new Error('getDB must be called from main process only');
  }
  try {
    var app = require('electron').app;
    return path.join(app.getPath('userData'), 'data.db');
  } catch (e) {
    // Not running in Electron (e.g. unit tests)
    return path.join(__dirname, '../../data/data.db');
  }
}

function getDB() {
  if (!db) {
    var fs = require('fs');
    var app;
    var userDataPath;
    try {
      app = require('electron').app;
      userDataPath = app.getPath('userData');
    } catch(e) {
      userDataPath = path.join(__dirname, '../../data');
    }
    var bootPath = path.join(userDataPath, 'bootstrap.json');
    if (fs.existsSync(bootPath)) {
      try {
        var boot = JSON.parse(fs.readFileSync(bootPath, 'utf8'));
        if (boot.key_verification && dbKey) {
          var crypto = require('crypto');
          var hash = crypto.createHash('sha256').update(dbKey).digest('hex');
          if (hash !== boot.key_verification) {
            var err = new Error('Incorrect key');
            err.message = 'WRONG_PASSWORD';
            throw err;
          }
        }
      } catch(e) {
        if (e.message === 'WRONG_PASSWORD') throw e;
      }
    }

    var dbPath = getDBPath();
    var dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }

    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
  }
  return db;
}

function closeDB() {
  if (db) { db.close(); db = null; }
}

function setDBKey(key) {
  dbKey = key;
}

function isOpen() {
  return db !== null;
}

module.exports = {
  getDB: getDB,
  closeDB: closeDB,
  setDBKey: setDBKey,
  isOpen: isOpen
};
