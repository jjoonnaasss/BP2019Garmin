package com.example.samsungtest

import android.app.Activity
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.samsung.android.sdk.healthdata.*
import com.samsung.android.sdk.healthdata.HealthConstants.StepCount
import com.samsung.android.sdk.healthdata.HealthDataResolver.ReadRequest
import com.samsung.android.sdk.healthdata.HealthPermissionManager.*
import com.samsung.android.sdk.healthdata.HealthResultHolder.ResultListener
import java.text.SimpleDateFormat
import java.util.*
import kotlin.collections.HashSet


class MainActivity : AppCompatActivity() {
    private val act: Activity = this
    private val dayMilli = 24 * 60 * 60 * 1000L
    private val tag = "MainActivity"

    var store: HealthDataStore? = null
    var pmsManager: HealthPermissionManager? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        createNotificationChannel()
        connect()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val descriptionText = getString(R.string.channel_description)
            val importance = NotificationManager.IMPORTANCE_LOW
            val channel = NotificationChannel(getString(R.string.channel_id), getString(R.string.channel_name), importance).apply {
                description = descriptionText
            }
            // Register the channel with the system
            val notificationManager: NotificationManager =
                getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
            Log.d(tag, "created channel")
        }
    }


    private fun connect() {
        Log.d(tag, "start connection")
        val cListener = object : HealthDataStore.ConnectionListener {
            override fun onConnected() {
                Log.d(tag, "connected")
                try {
                    HealthDataObserver.addObserver(store, StepCount.HEALTH_DATA_TYPE, obs)
                    readSteps()
                    Log.d(tag, "observer added, reading data")

                    Intent(act, ForegroundService::class.java).also { intent -> startService(intent) }

                } catch (e : SecurityException) {
                    permission(null)
                }
            }

            override fun onConnectionFailed(error: HealthConnectionErrorResult) {
                Log.d(tag, "connection failed")
            }

            override fun onDisconnected() {
                Log.d(tag, "disconnected")
            }
        }

        store = HealthDataStore(act, cListener)
        store!!.connectService()
    }

    fun permission(@Suppress("UNUSED_PARAMETER")view: View?) {
        val keys = HashSet<PermissionKey>()
        pmsManager = HealthPermissionManager(store)
        keys.add(PermissionKey(StepCount.HEALTH_DATA_TYPE, PermissionType.READ))
        val pListener =
            ResultListener<PermissionResult> { result ->
                if (result!!.resultMap.values.contains(false)) {
                    Log.d(tag, "permissions granted")
                } else {
                    Log.d(tag, "permissions not granted")
                    HealthDataObserver.addObserver(store, StepCount.HEALTH_DATA_TYPE, obs)
                    readSteps()
                }
            }
        pmsManager!!.requestPermissions(keys, act).setResultListener(pListener)
    }

    fun readSteps() {
        val resolver = HealthDataResolver(store, null)
        // Set time range from start time of today to the current time
        val startTime = getStartTimeOfToday()
        val endTime = startTime + dayMilli
        val request = ReadRequest.Builder()
            .setDataType(StepCount.HEALTH_DATA_TYPE)
            .setLocalTimeRange(
                StepCount.START_TIME, StepCount.TIME_OFFSET,
                startTime, endTime
            )
            .build()
        val history = mutableListOf<String>()
        val mListener = ResultListener<HealthDataResolver.ReadResult> { result ->
            var daily : Long = 0
            result.use { entries ->
                for (entry in entries) {
                    //val uuid = entry.getString(StepCount.UUID)
                    //val changed = entry.getLong(StepCount.UPDATE_TIME)
                    val count = entry.getInt(StepCount.COUNT)
                    val start = getDate(entry.getLong(StepCount.START_TIME))
                    val stop = getDate(entry.getLong(StepCount.END_TIME))
                    val offset = entry.getLong(StepCount.TIME_OFFSET) / (60 * 60)
                    val offHour = offset / 1000
                    val offHourStr = if (offHour >= 0) "+$offHour" else "$offHour"
                    val offMinStr = if (offset % 1000 == 500L) "30" else "00"
                    val speed = "%.1f".format(entry.getFloat(StepCount.SPEED))
                    daily += count
                    history.add("$start - $stop ($offHourStr:$offMinStr) : $count steps at $speed m/s")
                }
            }
            val stepText = getString(R.string.stepcount_text).format(daily)
            Log.d(tag, stepText)
            val stepCount : TextView = findViewById(R.id.stepCount)
            stepCount.setText(stepText, TextView.BufferType.NORMAL)
            val historyView : TextView = findViewById(R.id.history)
            historyView.text = history.joinToString(separator = "\n")
        }
        try {
            resolver.read(request).setResultListener(mListener)
        } catch (e: Exception) {
            Log.e(null, "couldn't read steps", e)
        }
    }

    private val obs = object : HealthDataObserver(null) {
        override fun onChange(dataTypeName : String) {
            readSteps()
        }
    }

    private fun getStartTimeOfToday(): Long {
        val today = Calendar.getInstance()
        today[Calendar.HOUR_OF_DAY] = 0
        today[Calendar.MINUTE] = 0
        today[Calendar.SECOND] = 0
        today[Calendar.MILLISECOND] = 0
        return today.timeInMillis
    }

    private fun getDate(milliSeconds: Long): String {
        val df = SimpleDateFormat("HH:mm", Locale.GERMANY)
        return df.format(Date(milliSeconds))
    }
}
