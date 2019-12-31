import { connect, ConnectRequest, Emitter, EmitterMessage } from "emitter-io";
import LatLon from "geodesy/latlon-spherical.js";
import { Hangar } from "./hangar";
import { Delivery, Warehouse } from "./warehouse";

const MAX_PAYLOAD_BATT_DRAIN: number = .005;     // max batt drain (%/s) at max payload
const BASE_BATT_DRAIN: number = .00005;     // max batt drain (%/s) at max payload
const LOW_BATT_LEVEL: number = .25;

interface Channel {
    name: "drone-position" | "event";
    key: string;
}

interface Location {
    lat: number;
    lon: number;
}

interface EventData {
    message: string;
    name: string;
    batteryPercent?: number;
    batteryConsumed?: number;
    event?: string;
    hangar?: string;
    location?: Location;
    payload?: number;
    warehouse?: string;
}

interface ControlEvent {
    type: "pause" | "resume" | "cancel" | "set_altitude";
    filter: {
        name?: string[];
        warehouse?: string[];
        hangar?: string[];
    };
    data: {
        altitude?: number;
    };
}

// Assumptions:
// Drone experiences constant accelleration
// Power/Payload impact acceleration
// Top speed capped at 10x power
export class Drone {
    public id: string;
    public name: string;
    private hangar: Hangar;
    private power: number;          // size of drone, impacts speed/accel

    private client: Emitter | null;
    private active: boolean;        // deployed in air
    private status: "charging" | "traveling" | "loading" | "unloading";

    private location: LatLon;       // current location
    private bearing: number;        // degrees from north
    private speed: number;          // m/s
    private accel: number;          // m/s^2

    private altitude: number;       // m
    private battery: number;        // percent
    private temperature: number;    // degree C

    private dest: LatLon;           // current destination
    private warehouse: Warehouse | null;    // warehouse drone is deployed to
    private jobs: Delivery[];       // package deliveries
    private completed: Delivery[];  // complete package deliveries

    private ctlPause: boolean;      // flag indicating the drone is paused
    private ctlCancel: boolean;     // flag indicating the drone operation is cancelled
    private ctlAltitude: number;    // the desired altitude for operation

    constructor(id: string, name: string, hangar: Hangar, power: number) {
        this.id = id;
        this.name = name;
        this.hangar = hangar;
        this.power = power;

        this.client = null;
        this.active = false;    // deployed
        this.status = "charging";

        this.location = hangar.location;
        this.bearing = 0;
        this.speed = 0;
        this.accel = 0;

        this.altitude = 0;
        this.battery = 1;       // 0 - 1, percent capacity
        this.temperature = 23;

        this.dest = hangar.location;
        this.warehouse = null;

        this.jobs = [];
        this.completed = [];

        this.ctlPause = false;
        this.ctlCancel = false;
        this.ctlAltitude = 300;
    }

    // take off an begin delivering packages from warehouse
    public async deploy(warehouse: Warehouse, broker: ConnectRequest) {
        // takeoff (assume it takes 5 secs)
        this.goTo(warehouse.location);
        this.altitude = this.ctlAltitude;
        this.battery = 1;
        this.warehouse = warehouse;
        this.speed = 0;
        this.accel = 0;

        if (!process.env.CHANNEL_KEY_DRONE_POSITION
            || !process.env.CHANNEL_KEY_DRONE_EVENT
            || !process.env.CHANNEL_KEY_CONTROL_EVENT) {
            console.log("Can't connect to ATC - missing channel key(s). Drone grounded...");
            return;
        }
        this.client = connect(broker, () => {
            console.log("%s lifting off", this.name);

            // tslint:disable-next-line: no-unused-expression
            this.client && this.client.subscribe({
                channel: "control-event",
                key: process.env.CHANNEL_KEY_CONTROL_EVENT || "",
            });

            // tslint:disable-next-line: no-unused-expression
            this.client && this.client.on("message", (msg: EmitterMessage) => {
                const message: ControlEvent = msg.asObject();
                if ((message.filter.name && message.filter.name.includes(this.name))
                    || (message.filter.warehouse && message.filter.warehouse.includes(
                            this.warehouse && this.warehouse.name || ""))
                    || (message.filter.hangar && message.filter.hangar.includes(this.hangar.name))
                ) {
                    console.log(message);
                    console.log("%s received control event %s", this.name, message.type);
                    this.sendEvent("control_event_rx", {
                        event: message.type,
                        message: "control event received",
                        name: this.name,
                    });
                } else {
                    return;
                }

                if (message.type === "pause") {
                    this.ctlPause = true;
                }
                if (message.type === "resume") {
                    this.ctlPause = false;
                }
                if (message.type === "cancel") {
                    this.ctlCancel = true;
                }
                if (message.type === "set_altitude") {
                    this.ctlAltitude = message.data.altitude || this.ctlAltitude;
                    console.log("%s adjusting altitude to %d", this.name, this.ctlAltitude);
                }

            });

            this.sendEvent("drone_deployed", {
                hangar: this.hangar.name,
                message: "Drone now active",
                name: this.name,
                warehouse: this.warehouse && this.warehouse.name || "unassigned",
            });
            this.active = true;
            this.run();
        });
    }

    private goTo(dest: LatLon) {
        this.status = "traveling";
        this.dest = dest;
    }

    private touchDown(decendedCallback: any, ascendedCallback: any)  {
        const decendTimer = setInterval(() => {
            // console.log("decending....");
            this.altitude = 3 * (this.altitude / 4);
            if (this.altitude < 20) {
                clearInterval(decendTimer);
                decendedCallback();
                const ascendTimer = setInterval(() => {
                    // console.log("ascending....");
                    this.altitude = this.altitude * (3 / 2);
                    if (this.altitude >= this.ctlAltitude) {
                        this.altitude = this.ctlAltitude;
                        clearInterval(ascendTimer);
                        ascendedCallback();
                    }
                }, 1000);
            }
        }, 1000);
    }

    private dropPackage() {
        this.touchDown(() => {
            console.log("%s delivered package...", this.name);
            const delivery = this.jobs.shift();
            if (delivery) {
                delivery.batteryConsumed = delivery.batteryConsumed - this.battery;
                this.completed.push(delivery);
                this.sendEvent("package_delivered", {
                    batteryConsumed: Math.floor(delivery.batteryConsumed * 100),
                    location: {
                        lat: delivery.dest.lat,
                        lon: delivery.dest.lon,
                    },
                    message: "Package has been delivered",
                    name: this.name,
                    payload: Math.floor(delivery.payload * 100),
                    warehouse: this.warehouse && this.warehouse.name || "unassigned",
                });
            }
        }, () => {
            this.goTo(
                this.jobs.length && this.jobs[0].dest ||
                this.warehouse && this.warehouse.location ||
                this.hangar.location);
        });
    }

    private reLoad() {
        this.touchDown(() => {
            console.log("%s picked up package...", this.name);
            this.jobs = this.warehouse && this.warehouse.pickup() || [];
            this.jobs.forEach((element) => {
                // save the starting battery level, we'll calculate consumption once we drop
                element.batteryConsumed = this.battery;
                this.sendEvent("package_loaded", {
                    location: {
                        lat: element.dest.lat,
                        lon: element.dest.lon,
                    },
                    message: "Package has been loaded",
                    name: this.name,
                    payload: Math.floor(element.payload * 100),
                    warehouse: this.warehouse && this.warehouse.name || "unassigned",
                });
            });
        }, () => {
            this.goTo(
                this.jobs.length && this.jobs[0].dest ||
                this.warehouse && this.warehouse.location ||
                this.hangar.location,
            );
        });
    }

    private async sendEvent(eventType: string, eventData: EventData) {
        // tslint:disable-next-line: no-unused-expression
        this.client && this.client.publish({
            channel: "drone-event",
            key: process.env.CHANNEL_KEY_DRONE_EVENT || "",
            message: JSON.stringify({
                data: eventData,
                type: eventType,
            }),
        });
    }
    private processDest(dest: LatLon) {
        // take action based on where we are
        if (this.status === "traveling") {
            if (this.warehouse && this.warehouse.location === dest) {
                this.status = "loading";
                this.reLoad();
            } else if (this.jobs.length && this.jobs[0].dest === dest) {
                this.status = "unloading";
                this.dropPackage();
            } else if (this.hangar.location === dest) {
                this.status = "charging";
                this.active = false;
            } else {
                console.log("unhandled destination......");
            }
        }
    }

    private processState() {
        // calculate the new state based on our last state
        const payload = this.jobs.reduce((sum, job) => sum + job.payload, 0);
        this.battery = Math.max(this.battery - (MAX_PAYLOAD_BATT_DRAIN * payload) - BASE_BATT_DRAIN, .01);
        this.location = this.location.destinationPoint(this.calcDistanceTraveled(1), this.bearing);
        this.bearing = this.location.initialBearingTo(this.dest) || 0;
        this.speed = Math.min(this.power * 10, Math.max(this.speed + this.accel, 0));
        const calcStatus = this.ctlPause && "pausing" || this.ctlCancel && "cancelling" || this.status;
        console.log("%s %s at location: %s, bearing: %d, alt %s, speed %d, accel %d, batt %d",
            this.name, calcStatus, this.location.toString(), this.bearing, this.altitude,
            this.speed, this.accel, this.battery);
        // tslint:disable-next-line: no-unused-expression
        this.client && this.client.publish({
            channel: "drone-position",
            key: process.env.CHANNEL_KEY_DRONE_POSITION || "",
            message: JSON.stringify({
                altitude: this.altitude,
                batteryPercent: Math.floor(this.battery * 100),
                bearing: this.bearing,
                destination: {
                    lat: this.dest.lat,
                    lon: this.dest.lon,
                },
                location: {
                    lat: this.location.lat,
                    lon: this.location.lon,
                },
                name: this.name,
                payloadPercent: Math.floor(payload * 100),
                speed: this.speed,
                status: calcStatus,
                tempCelsius: this.temperature + (this.altitude / 100) + (2 * Math.random()),
            }),
        });

        // calculate trajectory corrections
        if (this.ctlCancel && this.status === "traveling") {
            // force cancel as soon as possible
            this.goTo(this.hangar.location);
        }
        if (this.battery < LOW_BATT_LEVEL &&
                0 === this.jobs.length &&
                this.status === "traveling" &&
                this.dest !== this.hangar.location) {
            // divert to hangar if battery gets low while returning to warehouse
            this.sendEvent("low_battery", {
                batteryPercent: Math.floor(this.battery * 100),
                message: "Battery is low, returning to charge",
                name: this.name,
            });
            console.log("%s has low battery, diverting to hangar...", this.name);
            this.goTo(this.hangar.location);
        }
        const distToDest = this.location.distanceTo(this.dest); // meters
        const stopDist = this.calcStopDistance();
        // console.log("%d meters to dest, %d needed to stop", distToDest, stopDist);

        // adjust altitude when traveling
        if (this.status === "traveling") {
            this.altitude = (this.ctlAltitude > this.altitude)
                ? this.altitude + this.power : this.altitude - this.power;
            if (Math.abs(this.ctlAltitude - this.altitude) < this.power) {
                // add a little randomness
                this.altitude = this.ctlAltitude + (10 * Math.random()) - 5;
            }
        }

        if (this.ctlPause) {
            console.log ("pausing");
            this.accel = -this.power;
            if (Math.abs(this.speed) < this.power) {
                this.speed = 0;
                this.accel = 0;
            }
        } else if (distToDest < this.power) {
            // console.log("stopping");
            this.location = this.dest;
            this.speed = 0;
            this.accel = 0;
            this.processDest(this.dest);
        } else if (distToDest < (stopDist + (2 * this.speed))) {
            // console.log("slowing down");
            this.accel = -this.power;
        } else {
            // console.log("full speed ahead");
            this.accel = this.power;
        }
    }

    private processErrors() {
        // calculate random error and warning events
        if (Math.random() > .999) {
            // .1% chance of high wind
            this.sendEvent("system_warning", {
                location: {
                    lat: this.location.lat,
                    lon: this.location.lon,
                },
                message: "High Wind Warning",
                name: this.name,
            });
        }

        if (Math.random() > .999) {
            // .1% chance of battery overheating
            this.sendEvent("system_warning", {
                location: {
                    lat: this.location.lat,
                    lon: this.location.lon,
                },
                message: "High Battery Temperature",
                name: this.name,
            });
        }

        if (Math.random() > .99995) {
            // .005% chance of motor running inefficient
            this.sendEvent("system_error", {
                location: {
                    lat: this.location.lat,
                    lon: this.location.lon,
                },
                message: "Motor Overcurrent",
                name: this.name,
            });
        }

        if (Math.random() > .9999) {
            // .01% chance of gps sensor malfunction
            this.sendEvent("system_error", {
                location: {
                    lat: this.location.lat,
                    lon: this.location.lon,
                },
                message: "GPS Sensor Malfunction",
                name: this.name,
            });
        }

        if (Math.random() > .9999) {
            // .01% chance of gyro sensor malfunction
            this.sendEvent("system_error", {
                location: {
                    lat: this.location.lat,
                    lon: this.location.lon,
                },
                message: "Gyro Sensor Malfunction",
                name: this.name,
            });
        }
    }

    private async run() {
        while (this.active) {
            this.processState();
            this.processErrors();
            // console.log(this);
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        await this.sendEvent("drone_grounded", {
            batteryPercent: Math.floor(this.battery * 100),
            hangar: this.hangar.name,
            message: "Drone returned to hangar",
            name: this.name,
        });
        console.log("%s returned to hangar...", this.name);
        // tslint:disable-next-line: no-unused-expression
        this.client && this.client.disconnect();
        this.client = null;
        // console.log(this);
    }

    private calcDistanceTraveled(time: number) {
        const Vi = this.speed;
        const a = this.accel;
        return (Vi * time) + (.5 * a * time * time);
    }

    private calcStopDistance() {
        const Vi = this.speed;
        const a = this.power;
        const t = (Vi / a);  // time required to stop
        return (Vi * t) - (.5 * a * t * t);
    }
}
