var conn = require('../connection');

function addToQueue(operation, tableName, recordId, payload) {
  var db = conn.getDB();
  var existing = db.prepare(
    'SELECT id FROM sync_queue WHERE table_name = ? AND record_id = ? AND retry_count < 5'
  ).get(tableName, recordId);

  if (existing) {
    db.prepare(
      'UPDATE sync_queue SET operation = ?, payload = ?, last_error = NULL WHERE id = ?'
    ).run(operation, payload ? JSON.stringify(payload) : null, existing.id);
  } else {
    db.prepare(
      'INSERT INTO sync_queue (operation, table_name, record_id, payload, created_at) ' +
      "VALUES (?, ?, ?, ?, datetime('now'))"
    ).run(operation, tableName, recordId,
          payload ? JSON.stringify(payload) : null);
  }
}

function getPendingQueue() {
  return conn.getDB()
    .prepare('SELECT * FROM sync_queue WHERE retry_count < 5 ORDER BY created_at ASC')
    .all();
}

function getPendingCount() {
  var row = conn.getDB()
    .prepare('SELECT COUNT(*) as cnt FROM sync_queue WHERE retry_count < 5')
    .get();
  return row ? row.cnt : 0;
}

function markSuccess(id) {
  conn.getDB()
    .prepare('DELETE FROM sync_queue WHERE id = ?')
    .run(id);
}

function markFailed(id, errorMessage) {
  conn.getDB()
    .prepare(
      'UPDATE sync_queue SET retry_count = retry_count + 1, ' +
      'last_error = ? WHERE id = ?'
    )
    .run(String(errorMessage), id);
}

function clearQueue() {
  conn.getDB().prepare('DELETE FROM sync_queue').run();
}

function clearFailedQueue() {
  conn.getDB()
    .prepare('DELETE FROM sync_queue WHERE retry_count >= 5')
    .run();
}

module.exports = {
  addToQueue:       addToQueue,
  getPendingQueue:  getPendingQueue,
  getPendingCount:  getPendingCount,
  markSuccess:      markSuccess,
  markFailed:       markFailed,
  clearQueue:       clearQueue,
  clearFailedQueue: clearFailedQueue
};
