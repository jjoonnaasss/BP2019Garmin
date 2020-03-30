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
import com.samsung.android.sdk.healthdata.*
import com.samsung.android.sdk.healthdata.HealthConstants.*
import com.samsung.android.sdk.healthdata.HealthDataResolver.ReadRequest
import com.samsung.android.sdk.healthdata.HealthPermissionManager.*
import com.samsung.android.sdk.healthdata.HealthResultHolder.ResultListener
import java.text.SimpleDateFormat
import java.util.*
import kotlin.collections.HashSet
import kotlin.math.roundToInt


enum class Stage {
    LIGHT, DEEP, REM
}

sealed class Data
data class Sleep(val stage: Stage) : Data()
data class Steps(val speed: Float) : Data()
data class Glucose(val mmpl: Float) : Data()
data class Heart(val bpm: Float) : Data()

data class Meta(val uuid: String, val start: Long, val end: Long, val offset: Long)
data class Measurement(val meta: Meta, val data: Data)

data class ODV(val type: String, val value: String, val epoch: Long, val isoTime: String)

class MainActivity : AppCompatActivity() {
    private val act: Activity = this
    private val dayMilli = 24 * 60 * 60 * 1000L
    private val tag = "MainActivity"
    private val datatypes = listOf(StepCount.HEALTH_DATA_TYPE, Exercise.HEALTH_DATA_TYPE,
        BloodGlucose.HEALTH_DATA_TYPE, HeartRate.HEALTH_DATA_TYPE, SleepStage.HEALTH_DATA_TYPE)

    var store: HealthDataStore? = null

    val test : Data = Sleep(Stage.LIGHT)

    override fun onCreate(savedInstanceState: Bundle?) {
        // this method is called when the app is started

        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        createNotificationChannel()
        connect()
    }

    private fun createNotificationChannel() {
        // create notification channel used by the foreground service's notification

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
        // connect to store and start observing & reading data

        Log.d(tag, "start connection")
        val cListener = object : HealthDataStore.ConnectionListener {
            override fun onConnected() {
                Log.d(tag, "connected")
                try {
                    startReading()
                    Log.d(tag, "observer added, reading data")
                } catch (e : SecurityException) {
                    // don't have appropriate permissions
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

    private fun startReading() {
        /* TODO
        SleepStage -> SLEEP_LIGHT, SLEEP_DEEP, SLEEP_REM
        Exercise -> EXERCISE_LOW, EXERCISE_MID, EXERCISE_HIGH
        BloodGlucose -> GLUCOSE_BG
        HeartRate -> HEART_RATE
        StepCount -> EXERCISE_LOW, EXERCISE_MID, EXERCISE_HIGH
         */
        for (data in datatypes) {
            HealthDataObserver.addObserver(store, data, obs)
        }
        readData()
        Intent(act, ForegroundService::class.java).also { intent -> startService(intent) }
    }

    fun permission(@Suppress("UNUSED_PARAMETER")view: View?) {
        // Ask user for permissions

        val keys = HashSet<PermissionKey>()
        val pmsManager = HealthPermissionManager(store)
        for (data in datatypes) {
            keys.add(PermissionKey(data, PermissionType.READ))
        }
        val pListener =
            ResultListener<PermissionResult> { result ->
                if (result!!.resultMap.values.contains(false)) {
                    Log.d(tag, "permissions not granted")
                } else {
                    Log.d(tag, "permissions granted")
                    startReading()
                }
            }
        pmsManager.requestPermissions(keys, act).setResultListener(pListener)
    }

    private fun read(data: String, listener: ResultListener<HealthDataResolver.ReadResult>) {
        val resolver = HealthDataResolver(store, null)
        // Set time range from start time of today to the current time
        // the time is coded as the number of milliseconds since 00:00:00 UTC on 1 January 1970
        val startTime = getStartTimeOfToday()
        val endTime = startTime + dayMilli
        val request = ReadRequest.Builder()
            .setDataType(data)
            .setLocalTimeRange(
                SessionMeasurement.START_TIME, SessionMeasurement.TIME_OFFSET,
                startTime, endTime
            )
            .build()
        try {
            // Request data asynchronously.
            // Synchronous requests can be made like this:
            // val rdResult = resolver.read(request).await()
            // This is not allowed in the main thread, but may be acceptable for services.
            resolver.read(request).setResultListener(listener)
        } catch (e: Exception) {
            Log.e(null, "couldn't read data", e)
        }
    }

    private fun measureToODV(m: Measurement): ODV {
        val isoTime = ""
        val start = m.meta.start
        val duration = (m.meta.end - start).toString()
        return when (m.data) {
            is Sleep -> ODV(when(m.data.stage) {
                Stage.LIGHT -> "SLEEP_LIGHT"
                Stage.DEEP -> "SLEEP_DEEP"
                Stage.REM -> "SLEEP_REM"
            }, duration, start, isoTime)
            is Steps -> ODV("EXERCISE_MID", duration, start, isoTime)
            is Glucose -> ODV("GLUCOSE_BG", m.data.mmpl.toString(), start, isoTime)
            is Heart -> ODV("HEART_RATE", m.data.bpm.roundToInt().toString(), start, isoTime)
        }
    }

    fun ODVtoJSON(o: ODV) =
        "{\"origin\":\"unknown\",\"source\":\"Samsung-Health\",\"type\":\"${o.type}\",\"epoch\":${o.epoch},\"isoTime\":\"${o.isoTime}\",\"value\":\"${o.value}\"}"

    private fun getMeta(entry: HealthData): Meta {
        val uuid = entry.getString(StepCount.UUID)
        val start = entry.getLong(StepCount.START_TIME)
        val end = entry.getLong(StepCount.END_TIME)
        val offset = entry.getLong(StepCount.TIME_OFFSET)
        return Meta(uuid, start, end, offset)
    }

    fun readData() {
        val entries = mutableListOf<Measurement>()
        val stepListener = ResultListener<HealthDataResolver.ReadResult> { result ->
            var daily : Long = 0
            for (entry in result) {
                val speed = entry.getFloat(StepCount.SPEED)
                entries.add(Measurement(getMeta(entry), Steps(speed)))
            }
            result.close()
        }

        val odvs = entries.map {measureToODV(it)}
        read(StepCount.HEALTH_DATA_TYPE, stepListener)
    }

    fun offsetToTimezone(offset: Long): String {
        val offHour = offset / (60 * 60) / 1000
        val offHourStr = if (offHour >= 0) "+$offHour" else "$offHour"
        val offMinStr = if (offset % 60 * 60 * 1000 == 500L) "30" else "00"
        return "GTM$offHourStr:$offMinStr"
    }

    fun readDataOld() {
        // read StepCount data and update UI

        val resolver = HealthDataResolver(store, null)
        // Set time range from start time of today to the current time
        // the time is coded as the number of milliseconds since 00:00:00 UTC on 1 January 1970
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
        // mListener receives the results of the query
        val mListener = ResultListener<HealthDataResolver.ReadResult> { result ->
            var daily : Long = 0
            for (entry in result) {
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
            result.close()
            val stepText = getString(R.string.stepcount_text).format(daily)
            Log.d(tag, stepText)
            val stepCount : TextView = findViewById(R.id.stepCount)
            stepCount.setText(stepText, TextView.BufferType.NORMAL)
            val historyView : TextView = findViewById(R.id.history)
            historyView.text = history.joinToString(separator = "\n")
        }
        try {
            // Request data asynchronously.
            // Synchronous requests can be made like this:
            // val rdResult = resolver.read(request).await()
            // This is not allowed in the main thread, but may be acceptable for services.
            resolver.read(request).setResultListener(mListener)
        } catch (e: Exception) {
            Log.e(null, "couldn't read steps", e)
        }
    }

    private val obs = object : HealthDataObserver(null) {
        // waits for health data to change
        override fun onChange(dataTypeName : String) {
            readData()
        }
    }

    private fun getStartTimeOfToday(): Long {
        // get time of the current day's beginning in milliseconds since 00:00:00 UTC on 1 January 1970
        val today = Calendar.getInstance()
        today[Calendar.HOUR_OF_DAY] = 0
        today[Calendar.MINUTE] = 0
        today[Calendar.SECOND] = 0
        today[Calendar.MILLISECOND] = 0
        return today.timeInMillis
    }

    fun fmtDate(epoch: Long, timezone: String): String {
        val date = Date(epoch)
        val sdf = SimpleDateFormat("yyyy-MM-ddTHH:mm:ssX")
        sdf.timeZone = TimeZone.getTimeZone(timezone)
        return sdf.format(date)
    }

    private fun getDate(milliSeconds: Long): String {
        // convert time to String containing hours and minutes
        val df = SimpleDateFormat("HH:mm", Locale.GERMANY)
        return df.format(Date(milliSeconds))
    }
}
