import LatLon from "geodesy/latlon-spherical.js";
import { Drone } from "./drone";

export interface Delivery {
    payload: number;
    dest: LatLon;
}

export class Warehouse {

    public location: LatLon;
    public range: number;

    constructor(location: LatLon, serviceRange: number) {
        this.location = location;
        this.range = serviceRange;
    }

    public pickup(): Delivery[] {
        const deliveryLocation = this.location.destinationPoint(
            (Math.random() * (this.range - 500) + 500),     // random distance in range
            (Math.random() * 360),                          // random bearing
        );
        const payload = Math.random();
        console.log("New Delivery: %d payload to %s", payload, deliveryLocation.toString());
        return [{dest: deliveryLocation, payload}];
    }
}
