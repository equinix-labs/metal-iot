import { connect, ConnectRequest, Emitter } from "emitter-io";
import LatLon from "geodesy/latlon-spherical.js";
import { Delivery, Warehouse } from "./warehouse";

const MAX_PAYLOAD_BATT_DRAIN: number = .005;     // max batt drain (%/s) at max payload
const BASE_BATT_DRAIN: number = .00005;     // max batt drain (%/s) at max payload
const LOW_BATT_LEVEL: number = .25;

interface Channel {
    name: "drone-position" | "event";
    key: string;
}

// Assumptions:
// Drone experiences constant accelleration
// Power/Payload impact acceleration
// Top speed capped at 10x power
export class Drone {
    public id: string;
    public name: string;
    private hangar: any;
    private power: number;          // size of drone, impacts speed/accel

    private client: Emitter | null;
    private channels: Channel[];
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

    constructor(id: string, name: string, hangar: any, power: number) {
        this.id = id;
        this.name = name;
        this.hangar = hangar;
        this.power = power;

        this.client = null;
        this.channels = [];
        this.active = false;    // deployed
        this.status = "charging";

        this.location = hangar.location;
        this.bearing = 0;
        this.speed = 0;
        this.accel = 0;

        this.altitude = 0;
        this.battery = 1;       // 0 - 1, percent capacity
        this.temperature = 15;

        this.dest = hangar.location;
        this.warehouse = null;

        this.jobs = [];
        this.completed = [];
    }

    // take off an begin delivering packages from warehouse
    public async deploy(warehouse: Warehouse, broker: ConnectRequest) {
        // takeoff (assume it takes 5 secs)
        this.goTo(warehouse.location);
        this.altitude = 300;
        this.battery = 1;
        this.location = this.hangar.location;
        this.warehouse = warehouse;
        this.speed = 0;
        this.accel = 0;

        if (!process.env.CHANNEL_KEY_DRONE_POSITION) {
            console.log("Can't connect to ATC - no CHANNEL_KEY_DRONE_POSITION defined. Drone grounded...")
            return;
        }
        this.client = connect(broker, () => {
            console.log("%s lifting off", this.name);
            this.sendEvent('drone_deployed', {
                message: "Drone now active",
                name: this.name,
                hanger: this.hangar.name,
                warehouse: this.warehouse && this.warehouse.name
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
                    if (this.altitude >= 300) {
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
                this.sendEvent('package_delivered', {
                    message: "Package has been delivered",
                    name: this.name,
                    warehouse: this.warehouse && this.warehouse.name,
                    payload: Math.floor(delivery.payload * 100),
                    location: {
                        lat: delivery.dest.lat,
                        lon: delivery.dest.lon,
                    },
                    batteryConsumed: Math.floor(delivery.batteryConsumed * 100),
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
            this.jobs.forEach(element => {
                // save the starting battery level, we'll calculate consumption once we drop
                element.batteryConsumed = this.battery;
                this.sendEvent('package_loaded', {
                    message: "Package has been loaded",
                    name: this.name,
                    warehouse: this.warehouse && this.warehouse.name,
                    payload: Math.floor(element.payload * 100),
                    location: {
                        lat: element.dest.lat,
                        lon: element.dest.lon
                    }
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

    private async sendEvent(eventType: string, eventData: object) {
        // tslint:disable-next-line: no-unused-expression
        this.client && this.client.publish({
            channel: "drone-event",
            key: process.env.CHANNEL_KEY_DRONE_EVENT || "",
            message: JSON.stringify({
                type: eventType,
                data: eventData,
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
        console.log("%s %s at location: %s, bearing: %d, speed %d, accel %d, batt %d",
            this.name, this.status, this.location.toString(), this.bearing, this.speed, this.accel, this.battery);
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
                tempCelsius: this.temperature,
            }),
        });

        // calculate trajectory corrections
        if (this.battery < LOW_BATT_LEVEL && 
                0 === this.jobs.length && 
                this.status === 'traveling' && 
                this.dest !== this.hangar.location) {
            // divert to hangar if battery gets low while returning to warehouse
            this.sendEvent('low_battery', {
                message: "Battery is low, returning to charge",
                name: this.name,
                batteryPercent: Math.floor(this.battery * 100),
            });
            console.log("%s has low battery, diverting to hangar...", this.name);
            this.goTo(this.hangar.location);
        }
        const distToDest = this.location.distanceTo(this.dest); // meters
        const stopDist = this.calcStopDistance();
        // console.log("%d meters to dest, %d needed to stop", distToDest, stopDist);

        if (distToDest < this.power) {
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

    private async run() {
        while (this.active) {
            this.processState();
            // console.log(this);
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        await this.sendEvent('drone_grounded', {
            message: "Drone returned to hangar",
            name: this.name,
            hanger: this.hangar.name
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
