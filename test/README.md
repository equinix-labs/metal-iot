# Drone Sim

This project simulates clusters of drones delivering packages from warehouses to surrounding areas.  The code has three main modules
1. hangar - represents an instance of a hangar for storing/recharging drones.  Hangars can deploy drones to warehouses.  When a drone has low battery it will return to the hangar.
2. warehouse - represents an instance of a warehouse which distributes packages to be delivered in the surrounding region.  Warehouses hand randomized delivery jobs to drones.
3. drone - represents a drone which completes deliver jobs.  Drones exhibit semi-realistic flight trajectory and battery drain.  Battery drain is impacted by the size of packages being delivered (payload).

## Getting Started

1. Configure the emitter host variables along with emitter channel keys for `drone-position` and `drone-event`(via OS or .env file).  `EMITTER_HOST` defaults to `127.0.0.1` if not set.  `EMITTER_PORT` defaults to `8080` if not set.

You can work with a local Emitter instance, or you can connect to the version deployed in your cluster using port-forwarding, or the NodePort 30080 and the public IP of one of the nodes.

```sh
export CHANNEL_KEY_DRONE_POSITION="pZtoyNQ_b3WPRc63Br5QJv8CCcP2gfKZ"
export CHANNEL_KEY_DRONE_EVENT="qlnEY07lFKttkvyZbyzshmiDFPQOo232"
```

Port-forwarding:

```sh
kubectl port-forward -n openfaas svc/emitter 8081:8080 &
```

```sh
export EMITTER_HOST=127.0.0.1
export EMITTER_PORT=8081
```

Local:

```sh
export EMITTER_HOST=172.23.98.23
export EMITTER_PORT=8124
```

2. Configure the warehouse and hangar initializers in app.ts to reflect your desired behavior.  By default it will deploy 20 drones to two warehouses in north Las Vegas.  Once the drones deplete their battery they will return to the hangar.

3. Launch the simulator

    ```sh
    npm i
    npm start
    ```

4. A listener module is included which will connect to emitter and monitor events created by the simulator.  Usage is optional once you've started the simulator.

    ```sh
    node dist/listener.js
    ```


## Drone Position Updates

Drones report their status via mqtt using emitter.io on the `drone-position` channel. 

```ts
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
        status: "traveling"
        tempCelsius: 4.2,
    }),
});

Valid values for `status` are "pausing", "aborting", "charging", "traveling", "loading", "unloading"

```

## Drone Events

Events are reported via the `drone-event` channel.

```ts
this.client.publish({
    channel: "drone-event",
    key: process.env.CHANNEL_KEY_DRONE_EVENT,
    message: JSON.stringify({
        type: "low_battery",
        data: {
            "name" "dronus maximus",
            "message": "Battery is low, returning to charge",
            "batteryPercent": 19
        }
    }),
});

The `data` field will always contain `message` and `name` fields.  All other fields are optional depending on the event type.
```

### Event Type: drone_deployed

Sent when a drone is deployed from hangar to a warehouse.

```ts
data: {
    message: "Drone now active",
    name: "dronus maximus",
    hangar: "Mothership",
    warehouse: "Newtown Central
}
```

### Event Type: drone_grounded

Sent when a drone returns to the hangar.

```ts
data: {
    message: "Drone returned to hangar",
    name: "dronus maximus",
    hangar: "Mothership",
    batteryPercent: 5
}
```

### Event Type: low_battery

Sent when battery is low and drone is returning to hangar to recharge.

```ts
data: {
    name: "dronus maximus",
    message: "Battery is low, returning to charge",
    batteryPercent: 19
}
```

### Event Type: package_loaded

Sent when a delivery is picked up from warehouse.

```ts
data: {
    name: "dronus maximus"
    message: "Package has been loaded",
    warehouse: "Newtown Central",
    location: {
        lat: -37.95105,
        lon: 144.42491
    },
    payload: 35     // percent of capacity
}
```

### Event Type: package_delivered

Sent when a delivery occurs.

```ts
data: {
    name: "dronus maximus",
    message: "Package has been delivered",
    warehouse: "Newtown Central",
    location: {
        lat: -37.95105,
        lon: 144.42491,
    },
    distance: 1234,         // meters
    payload: 35,            // percent of capacity
    batteryConsumed: 8      // percent of battery consumed during delivery
}
```

### Event Type: system_error

Sent when a malfunction occurs in the drone.

```ts
data: {
    name: "dronus maximus",
    message: "gps sensor error",
    location: {
        lat: -37.95105,
        lon: 144.42491
    },
}
```

### Event Type: control_event_rx

Sent whenever a control event is received by a drone

```ts
data: {
    name: "dronus maximus",
    message: "control event received",
    event: "paused"
}
```

## Controlling Drones

All drones listen for control events on the `control-event` channel. Control events allow for drones to be remotely managed for traffic control purposes.  Each message send on the `contol-event` channel has a `filter`, `type`, and `data` field.


```ts
this.client.publish({
    channel: "control-event",
    key: process.env.CHANNEL_KEY_CONTROL_EVENT,
    message: JSON.stringify({
        filter: {
            name: ["dronus maximus", "dronus minimus", "felix the drone"],
            warehouse: [],
            hangar: []
        }
        type: "pause",
        data: {}
    }),
});

`filter` is an object including whitelist criteria for which drones the event applies to. List of names, warehouses, and hangars be used. A drone matching ANY of the lists will be impacted by the event.

`type` indicates the event type

`data` is an object containing event specific data.  Details of each event type

```

### Event Type: pause
Sent when a drone should immediately pause.  Drones will hold position until they have a low battery or receive a `resume` event

```ts
data: {}  // None
```

### Event Type: resume
Sent when a drone should resume operation.  

```ts
data: {}  // None
```

### Event Type: abort
Sent when a drone should abort operations and return to the hangar.  

```ts
data: {}  // None
```

### Event Type: set_altitude
Sent to specify a target altitude that the drone should fly at.  Typically used to avoid collisions with other drones.

```ts
data: {
    altitude: 420  // meters
}
```

