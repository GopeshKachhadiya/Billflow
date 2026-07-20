// Cloud-first architecture: All data is written directly to Supabase online.
// Sync queue functions are maintained for compatibility with any legacy background checks.

function addToQueue(operation, tableName, recordId, payload) {
  // No-op: directly handled online
}

async function getPendingQueue() {
  return [];
}

async function getPendingCount() {
  return 0;
}

function markSuccess(id) {
  // No-op
}

function markFailed(id, errorMessage) {
  // No-op
}

function clearQueue() {
  // No-op
}

function clearFailedQueue() {
  // No-op
}

module.exports = {
  addToQueue: addToQueue,
  getPendingQueue: getPendingQueue,
  getPendingCount: getPendingCount,
  markSuccess: markSuccess,
  markFailed: markFailed,
  clearQueue: clearQueue,
  clearFailedQueue: clearFailedQueue
};
