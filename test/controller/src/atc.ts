import { config } from "dotenv";
import { connect, ConnectRequest, Emitter, EmitterMessage } from 'emitter-io';
import LatLon from "geodesy/latlon-spherical.js";

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

interface Options {
    host: string;
    port: number;
    channels: {[channel: string]: string };  // value is the channel key
    secure?: boolean;
}

const CHAN_CONTROL_EVENT: string = "control-event";
const CHAN_DRONE_EVENT      = "drone-event";
const CHAN_DRONE_POSITION   = "drone-position"


export class TrafficController {

    private run: boolean;
    private client: Emitter;
    private drones: {[name: string]: Position};
    private channels: {[channel: string]: string};

    constructor(options: Options) {
        this.run = true;
        this.drones = {};
        this.channels = options.channels;
        this.client = connect({
                host: options.host,
                port: options.port,
                secure: !! options.secure}, () => {
            console.log("connected to data feed");

            this.client.on('error', (error: any) => console.log(error.stack))
            this.client.on('offline', () => { this.run = false })
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

                    // reduce altitude to avoid weather
                    if (message.type === "system_warning") {
                        console.log("%s sent warning - adjusting for conditions", message.data.name);
                        this.setAltitude(message.data.name, 50);
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

    public async tempPause( drone: string ) {
        // pause drone for 30 seconds to allow condition to clear
        console.log("Reducing altitude and speed", drone);
        this.pauseDrone(drone);
        this.setAltitude(drone, 50);
        await new Promise((resolve) => setTimeout(resolve, 30000));
        console.log("%s resuming operation", drone);
        this.resumeDrone(drone);
    }

    public async monitor() {
        this.client.subscribe({
            channel: CHAN_DRONE_POSITION,
            key: this.channels[CHAN_DRONE_POSITION],
        });

        this.client.subscribe({
            channel: CHAN_DRONE_EVENT,
            key: this.channels[CHAN_DRONE_EVENT],
        });

        while (this.run) {
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }

    private async sendControlEvent( msg: ControlEvent) {
        // tslint:disable-next-line: no-unused-expression
        this.client && this.client.publish({
            channel: CHAN_CONTROL_EVENT,
            key: this.channels[CHAN_CONTROL_EVENT],
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
