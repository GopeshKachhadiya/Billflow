package com.billflow.app.sync

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.billflow.app.data.local.AppDatabase
import com.billflow.app.data.local.SyncQueue
import com.billflow.app.data.remote.NetworkClient
import com.billflow.app.data.repository.BillRepository
import com.google.gson.JsonArray
import com.google.gson.JsonObject

class SyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        Log.d("SyncWorker", "Background sync worker started")
        val repository = BillRepository(applicationContext)

        if (!repository.isLoggedIn()) {
            Log.d("SyncWorker", "User not logged in. Skipping background sync.")
            return Result.success()
        }

        val session = repository.getSession() ?: return Result.success()
        val db = AppDatabase.getDatabase(applicationContext)

        // ── 1. PUSH PENDING LOCAL CHANGES ─────────────────────────────────────────
        try {
            val pendingQueue = db.syncQueueDao().getPendingQueue()
            if (pendingQueue.isNotEmpty()) {
                val baseUrl = repository.getSetting("n8n_base_url") ?: "http://10.0.2.2:5678"
                val secret = repository.getSetting("n8n_secret") ?: ""
                val n8nApi = NetworkClient.getN8nApi(baseUrl)

                val syncItemsArray = JsonArray()
                for (item in pendingQueue) {
                    val itemObj = JsonObject().apply {
                        addProperty("id", item.id)
                        addProperty("operation", item.operation)
                        addProperty("table_name", item.tableName)
                        addProperty("record_id", item.recordId)
                        addProperty("payload", item.payload)
                        addProperty("retry_count", item.retryCount)
                        addProperty("last_error", item.lastError)
                        addProperty("created_at", item.createdAt)
                    }
                    syncItemsArray.add(itemObj)
                }

                val payload = JsonObject().apply {
                    add("sync_items", syncItemsArray)
                }

                val response = n8nApi.syncPush("/webhook/sync-push", secret, payload)
                if (response.isSuccessful) {
                    Log.d("SyncWorker", "Successfully pushed local sync queue to n8n")
                    for (item in pendingQueue) {
                        db.syncQueueDao().delete(item.id)
                    }
                } else {
                    Log.e("SyncWorker", "Failed to push sync queue: ${response.code()}")
                    for (item in pendingQueue) {
                        db.syncQueueDao().updateError(item.id, "HTTP ${response.code()}", item.retryCount + 1)
                    }
                }
            }
        } catch (e: Exception) {
            Log.e("SyncWorker", "Sync push execution failed: ${e.message}")
        }

        // ── 2. PULL REMOTE CHANGES FROM SUPABASE ──────────────────────────────────
        try {
            val pullResult = repository.pullDataFromSupabase(session.id)
            if (pullResult.isSuccess) {
                Log.d("SyncWorker", "Successfully pulled fresh data from Supabase")
            } else {
                Log.w("SyncWorker", "Failed to pull fresh data: ${pullResult.exceptionOrNull()?.message}")
            }
        } catch (e: Exception) {
            Log.e("SyncWorker", "Sync pull execution failed: ${e.message}")
        }

        return Result.success()
    }
}
