import LatLon from "geodesy/latlon-spherical.js";
import { Drone } from "./drone";
import { Warehouse } from "./warehouse";
import { Weather } from "./weather";

interface Squadron {
 [id: string]: Drone;
}

export class Hangar {
    public name: string;
    public location: LatLon;
    public drones: Squadron;
    public weather: Weather;

    constructor(name: string, location: LatLon, droneCount: number, weather: Weather) {
        this.name = name;
        this.location = location;
        this.drones = {};
        this.weather = weather;

        // one out of 10 have a bad battery
        for (let droneId = 0; droneId < droneCount; droneId++) {
            this.drones[droneId] = new Drone(droneId.toString(), "cylon " + droneId.toString(), this, 10, 
                this.weather, 0 === droneId % 10);
        }
    }

    public deployDrone(id: string, warehouse: Warehouse) {
        this.drones[id].deploy(warehouse, {
            host: process.env.EMITTER_HOST || "127.0.0.1",
            port: parseInt(process.env.EMITTER_PORT || "8080", 10),
        });
    }
}
