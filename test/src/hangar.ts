import LatLon from "geodesy/latlon-spherical.js";
import { Drone } from "./drone";
import { Warehouse } from "./warehouse";

interface Squadron {
 [id: string]: Drone;
}

export class Hangar {

    public location: LatLon;
    public drones: Squadron;

    constructor(location: LatLon, droneCount: number) {
        this.location = location;
        this.drones = {};

        for (let droneId = 0; droneId < droneCount; droneId++) {
            this.drones[droneId] = new Drone(droneId.toString(), "cylon " + droneId.toString(), this, 10);
        }
    }

    public deployDrone(id: string, warehouse: Warehouse) {
        this.drones[id].deploy(warehouse, {
            host: process.env.EMITTER_HOST || "127.0.0.1",
            port: parseInt(process.env.EMITTER_PORT || "8080", 10),
        });
    }
}
