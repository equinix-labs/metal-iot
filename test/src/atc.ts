import { config } from "dotenv";
import { connect, ConnectRequest, Emitter, EmitterMessage } from 'emitter-io';
import LatLon from "geodesy/latlon-spherical.js";
import { Hangar } from "./hangar";
import { Warehouse } from "./warehouse";

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

interface DroneEvent {
    type: "drone_deployed" | "drone_grounded" | "low_battery" | "package_loaded" | "package_delivered" | "system_warning" | "system_error" | "control_event_rx";
    data: {
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
}


interface DronePosition {
    altitude: number;
    batteryPercent: number;
    bearing: number;
    destination: {
        lat: number;
        lon: number;
    };
    location: {
        lat: number;
        lon: number;
    };
    name: string;
    payloadPercent: number;
    speed: number;
    status: string;
    tempCelsius: number;
}

interface Position {
    location: LatLon;
    dest: LatLon;
    speed: number;
    bearing: number;
    altitude: number;
}

config();
if (!process.env.CHANNEL_KEY_DRONE_POSITION ||
        !process.env.CHANNEL_KEY_DRONE_EVENT ||
        !process.env.CHANNEL_KEY_CONTROL_EVENT) {
    console.error("You must set CHANNEL_KEY_CONTROL_EVENT, CHANNEL_KEY_DRONE_POSITION and CHANNEL_KEY_DRONE_EVENT env variables");
}

export class TrafficController {

    private client: Emitter;
    private drones: {[name: string]: Position};
    private warehouses: Warehouse[];
    private hangars: Hangar[];

    constructor(broker: ConnectRequest, warehouses: Warehouse[], hangars: Hangar[]) {
        this.drones = {};
        this.warehouses = warehouses;
        this.hangars = hangars;

        this.client = connect(broker, () => {
            console.log("connected to data feed");

            this.client.subscribe({
                channel: "drone-position",
                key: process.env.CHANNEL_KEY_DRONE_POSITION || "",
            });

            this.client.subscribe({
                channel: "drone-event",
                key: process.env.CHANNEL_KEY_DRONE_EVENT || "",
            });

            this.client.on("message", (msg: EmitterMessage) => {
                if (msg.channel === "drone-position/") {
                    const message: DronePosition = msg.asObject();
                    // save or update the position info
                    if (!this.drones[message.name]) {
                        this.drones[message.name] = {
                            altitude: message.altitude,
                            bearing: message.bearing,
                            dest: new LatLon(message.destination.lat, message.destination.lon),
                            location: new LatLon(message.location.lat, message.location.lon),
                            speed: message.speed,
                        };
                    } else {
                        this.drones[message.name].bearing = message.bearing;
                        this.drones[message.name].dest.lat = message.destination.lat;
                        this.drones[message.name].dest.lon = message.destination.lon;
                        this.drones[message.name].location.lat = message.location.lat;
                        this.drones[message.name].location.lon = message.location.lon;
                        this.drones[message.name].speed = message.speed;
                        // altitude updates are internally calculated and managed
                    }
                    this.detectCollision(message.name, this.drones[message.name]);

                } else if (msg.channel === "drone-event/") {
                    // manage behavior based on events
                    const message: DroneEvent = msg.asObject();

                    // drones return to warehouse at 200 meters
                    if (message.type === "package_delivered") {
                        console.log("%s delivered package - adjusting altitude", message.data.name);
                        this.setAltitude(message.data.name, 200);
                    }

                    // drones deliver at 100 meters
                    if (message.type === "package_loaded") {
                        console.log("%s loaded package - adjusting altitude", message.data.name);
                        this.setAltitude(message.data.name, 200);
                    }

                    // drones return to hangar at 300 meters
                    if (message.type === "low_battery") {
                        console.log("%s returning to hangar - adjusting altitude", message.data.name);
                        this.setAltitude(message.data.name, 300);
                    }

                    // pause and reduce altitude
                    if (message.type === "system_warning") {
                        console.log("%s sent warning - adjusting for conditions", message.data.name);
                        this.handleWarning(message.data.name);
                    }

                    // return to hangar
                    if (message.type === "system_error") {
                        console.log("%s sent error - cancelling", message.data.name);
                        this.setAltitude(message.data.name, 300);
                        this.cancelDrone(message.data.name);
                    }
                }
            });
        });
    }

    public async setAltitude( drone: string, alt: number) {
        // tslint:disable-next-line: no-unused-expression
        this.drones[drone].altitude = alt;
        this.sendControlEvent({
            data: {altitude: alt},
            filter: {name: [drone]},
            type: "set_altitude",
        });
    }

    public async pauseDrone( drone: string) {
        // tslint:disable-next-line: no-unused-expression
        this.sendControlEvent({
            data: {},
            filter: {name: [drone]},
            type: "pause",
        });
    }

    public async resumeDrone( drone: string) {
        // tslint:disable-next-line: no-unused-expression
        this.sendControlEvent({
            data: {},
            filter: {name: [drone]},
            type: "resume",
        });
    }

    public async cancelDrone( drone: string) {
        // tslint:disable-next-line: no-unused-expression
        this.sendControlEvent({
            data: {},
            filter: {name: [drone]},
            type: "cancel",
        });
    }

    public async handleWarning( drone: string ) {
        // pause drone for 30 seconds to allow condition to clear
        console.log("Pausing %s and lowering altitude", drone);
        this.pauseDrone(drone);
        this.setAltitude(drone, 50);
        await new Promise((resolve) => setTimeout(resolve, 30000));
        console.log("%s resuming operation", drone);
        this.resumeDrone(drone);
    }

    public async monitor() {
        while (true) {
            await new Promise((resolve) => setTimeout(resolve, 30000));
        }
    }

    private async sendControlEvent( msg: ControlEvent) {
        // tslint:disable-next-line: no-unused-expression
        this.client && this.client.publish({
            channel: "control-event",
            key: process.env.CHANNEL_KEY_CONTROL_EVENT || "",
            message: JSON.stringify(msg),
        });
    }

    private async detectCollision( name: string, position: Position ) {
        // check trajectory for airspace conflicts
        const conflicts = [];

        for ( const [otherName, other] of Object.entries(this.drones)) {
            if (otherName === name) {
                // can't collide with yourself
                continue;
            }

            if (position.dest.equals(other.dest)) {
                // ignore drones going to same location (hangar or warehouse)
                continue;
            }

            if (position.location.equals(other.location)) {
                // ignore drones in the same location (hangar or warehouse)
                continue;
            }

            if (position.location.equals(position.dest) || other.location.equals(other.dest)) {
                // ignore stationary drones
                continue;
            }

            if (Math.abs(position.altitude - other.altitude) >= 20) {
                // ignore drones running at significantly different altitudes
                continue;
            }

            if (position.location.distanceTo(other.location) > 600) {
                // drones far enough apart that collisions can't happen
                continue;
            }

            // find where the drone paths intersect
            const bear1To = position.location.initialBearingTo(position.dest);
            const bear1From = position.dest.initialBearingTo(position.location);
            const bear2To = other.location.initialBearingTo(other.dest);
            const bear2From = other.dest.initialBearingTo(other.location);

            const intersectionTo = LatLon.intersection(position.location, bear1To,
                other.location, bear2To);

            const intersectionFrom = LatLon.intersection(position.dest, bear1From,
                other.dest, bear2From);


            if (intersectionTo && intersectionFrom
                && intersectionTo.distanceTo(intersectionFrom) < 100) {
                // drones may intersect - alter course
                console.log("Potential path conflict between %s and %s", name, otherName);
                console.log(position);
                console.log(other);
                console.log(intersectionTo);
                console.log(intersectionFrom);
                conflicts.push(other);
            }
        }

        if (0 === conflicts.length) {
            return;
        }

        // find clear space, we want 20m between drones - locate gaps between drones > 40m
        const options = [];

        // start looking from ground up first
        conflicts.sort((a, b) => (a.altitude > b.altitude) ? 1 : -1);
        let floor = 50;
        for (const conflict of conflicts) {
            if (conflict.altitude - floor >= 40) {
                options.push(conflict.altitude - 20);
            }
            floor = conflict.altitude;
        }

        // now look from sky down
        conflicts.sort((a, b) => (b.altitude > a.altitude) ? 1 : -1);
        let ceil = 1000;
        for (const conflict of conflicts) {
            if (ceil - conflict.altitude > 40) {
                options.push(conflict.altitude + 20);
            }
            ceil = conflict.altitude;
        }

        // sort options to find closest gap
        options.sort((a: number, b: number) => {
            return Math.abs(position.altitude - a) > Math.abs(position.altitude - b) ? 1 : -1;
        });
        console.log(options);
        console.log("adjusting %s from %d to %d to avoid airspace violatioon",
            name, position.altitude, options[0]);

        // adjust the drone
        this.setAltitude(name, options[0]);
    }
}

const hang = new Hangar("area51", new LatLon(36.264869, -115.164221), 30);
const distNE = new Warehouse("NE Vegas", new LatLon(36.240648, -115.135846), 1000);
const distNW = new Warehouse("NW Vegas", new LatLon(36.240648, -115.125846), 1000);
const listener = new TrafficController({
    host: process.env.EMITTER_HOST || "127.0.0.1",
    port: parseInt(process.env.EMITTER_PORT || "8080", 10),
}, [distNE, distNW], [hang]);

listener.monitor();
