# Drone Sim

This project simulates clusters of drones delivering packages from warehouses to surrounding areas.  The code has three main modules
1. hangar - represents an instance of a hangar for storing/recharging drones.  Hangars can deploy drones to warehouses.  When a drone has low battery it will return to the hangar.
2. warehouse - represents an instance of a warehouse which distributes packages to be delivered in the surrounding region.  Warehouses hand randomized delivery jobs to drones.
3. drone - represents a drone which completes deliver jobs.  Drones exhibit semi-realistic flight trajectory and battery drain.  Battery drain is impacted by the size of packages being delivered (payload).

## Getting Started
1. Configure the emitter host variables along with `CHANNEL_KEY_DRONE_POSITION` env variable with the emitter channel key (via OS or .env file).  `EMITTER_HOST` defaults to `127.0.0.1` if not set.  `EMITTER_PORT` defaults to `8080` if not set.
    ```
    CHANNEL_KEY_DRONE_POSITION=pZtoyNQ_b3WPRc63Br5QJv8CCcP2gfKZ
    EMITTER_HOST=172.23.98.23
    EMITTER_PORT=8080
    ```

1. Configure the warehouse and hangar initializers in app.ts to relfect your desired behavior.  By default it will deploy 20 drones to two warehouses in north las vegas.  Once the drones deplete their battery they will return to the hangar.
1. Launch the sim
    ```
    npm i
    npm start
    ```


## Status Updates
Drones report their status via mqtt using emitter.io on the `drone-position` channel. 

```
this.client.publish({
    channel: "drone-position",
    key: process.env.CHANNEL_KEY_DRONE_POSITION,
    message: JSON.stringify({
        altitude: 312,          // meters
        batteryPercent: 73,
        bearing: 213.445,       // 0-360 degrees
        destination: {
            lat: -37.95103,
            lon: 144.42487,
        },
        location: {
            lat: -37.95105,
            lon: 144.42491,
        },
        name: "Alpha Cortex",
        payloadPercent: 34,
        speed: 20.3,            // meters/sec
        tempCelsius: 4.2,
    }),
});
```

## Events (TODO)

Events are reported via the `drone-event` channel.

```
this.client.publish({
    channel: "drone-event",
    key: process.env.CHANNEL_KEY_EVENT,
    message: JSON.stringify({
        type: "low_battery",
        data: {
            "message": "Battery is low, returning to charge"
            "batteryPercent": 19
        }
    }),
});
```

### Event Type: drone_deployed
Sent when a delivery is picked up from warehouse

```
data: {
    message: "Drone now active"
    name: "dronus maximus"
    hangar: "Mothership"
    warehouse: "Newtown Central
}
```

### Event Type: drone_grounded
Sent when a delivery is picked up from warehouse

```
data: {
    message: "Drone returned to hangar"
    name: "dronus maximus"
    hangar: "Mothership"
}
```

### Event Type: low_battery
Sent when battery is low and drone is returning to hangar to recharge

```
data: {
    name: "dronus maximus"
    message: "Battery is low, returning to charge"
    batteryPercent: 19
}
```

### Event Type: package_loaded
Sent when a delivery is picked up from warehouse

```
data: {
    name: "dronus maximus"
    message: "Package has been loaded"
    location: {
        lat: -37.95105,
        lon: 144.42491,
    },
    payload: 35,    // percent of capacity
}
```

### Event Type: package_delivered
Sent when a delivery occurs

```
data: {
    name: "dronus maximus"
    message: "Package has been delivered"
    location: {
        lat: -37.95105,
        lon: 144.42491,
    },
    distance: 1234,         // meters
    payload: 35,            // percent of capacity
    batteryConsumed: 8,     // percent
}
```

### Event Type: system_error
Sent when a malfunction occurs in the drone

```
data: {
    name: "dronus maximus"
    message: "gps sensor error"
    location: {
        lat: -37.95105,
        lon: 144.42491,
    },
}
```