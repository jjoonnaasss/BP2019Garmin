# Samsung Health Overview

## Samsung Health Android SDK

The Samsung Health Android SDK allows Android apps to access health data
from a Samsung Health app instance running on the same device in real time.

Official documentation:

* [Overview](https://developer.samsung.com/health/android/overview.html)
* [API reference](https://img-developer.samsung.com/onlinedocs/health/android/data/index.html)

## SamsungTest

This folder contains a demo application that illustrates the most important
aspects of working with the SDK. The app is written in [Kotlin](https://kotlinlang.org/)
using the [Android Studio IDE](https://developer.android.com/studio).

Android apps consist of "Activities", where each activity is responsible for a screen
in the user interface.
(More on the basics of Android development can be found [here](https://developer.android.com/guide/components/fundamentals).)
SamsungTest contains only one activity, which can be found in the file MainActivity.kt.
Most of the app's logic is found here.
When the app is started, the method "onCreate" is called.

To access health data, an app first needs to acquire a connection to the
[Samsung Health data store](https://developer.samsung.com/health/android/data/guide/health-data-store.html).
This occurs in the "connect" method by instantiating the "HealthDataStore" class
and providing it with a "ConnectionListener" which is notified when the connection is established.

Accessing data requires receiving the relevant permissions from the user first.
(See the "permission" method).
For this, we need to create a "HealthPermissionManager". We specify which permissions
are needed. A dialog then opens up and the user can choose which permissions to
grant.

The SDK can notify the app whenever data is created or updated.
We create a "HealthDataObserver" (called "obs" in our app) which we register
as an observer for a specific datatype so that we can react to new data of that
type being added (see method "startReading").

Requesting data (as in the "readSteps" method) 
works by first creating a "HealthDataResolver" which will read
our request and pass the results to a listener.
A read request can be constructed using a "ReadRequest.Builder".
It is necessary to specify the type of the requested data with the "setDataType"
method. Additionaly, "setLocalTimeRange" can be used to restrict the data to
a certain time range. A "ResultListener" is responsible for handling the results
of the query ("mlistener" in our app). A query is then performed by passing
both the request and the listener to the resolver.
The results are presented as an instance of the "HealthDataResolver.ReadResult" class,
which provides an iterator over the data entries.

Entries belong to the "HealthData" class. It maps property names (of type String) to values of
one of multiple types. A value of type Long can be accessed with the "getLong" method,
a value of type String with "getString", and so on.
Important properties include:

* [START_TIME, END_TIME, TIME_OFFSET](https://img-developer.samsung.com/onlinedocs/health/android/data/com/samsung/android/sdk/healthdata/HealthConstants.SessionMeasurement.html),
  which give the start, end and time offset (i.e. time zone) of a measurement,
* [UUID](https://img-developer.samsung.com/onlinedocs/health/android/data/com/samsung/android/sdk/healthdata/HealthConstants.Common.html), which gives a unique ID to each measurement,
* [UPDATE_TIME](https://img-developer.samsung.com/onlinedocs/health/android/data/com/samsung/android/sdk/healthdata/HealthConstants.Common.html), which gives the time when a measurement was updated and
* [DEVICE_UUID], which gives the unique ID of the device that took the measurement.

Additionally, each data type has specify properties, like StepCount.COUNT and StepCount.SPEED
for the [StepCount](https://img-developer.samsung.com/onlinedocs/health/android/data/com/samsung/android/sdk/healthdata/HealthConstants.StepCount.html) data type.

## Services

For an application to keep performing tasks in the background, it is necessary
to start a [service](https://developer.android.com/guide/components/services.html).
There are different types of services, but the only way to ensure that a service
can keep running indefinitely without being killed by the system is by using
a foreground service. Such a service is tied to permanent notification.