import { config } from "dotenv";
import LatLon from "geodesy/latlon-spherical.js";
import { Hangar } from "./hangar";
import { Warehouse } from "./warehouse";
import { Weather, Zone } from "./weather";

const distNE = new Warehouse("NE Vegas", new LatLon(36.240648, -115.135846), 1000);
const distNW = new Warehouse("NW Vegas", new LatLon(36.264499, -115.268259), 1000);
const weather = new Weather([
    {location: distNE.location.destinationPoint(300, 160), radius: 300, altitude: 120},
    {location: distNW.location.destinationPoint(300, 160), radius: 200, altitude: 190},
    {location: distNW.location.destinationPoint(800, 250), radius: 400, altitude: 150},
]);
const hang = new Hangar("area51", new LatLon(36.264869, -115.164221), 30, weather);

// const distNW = new Warehouse("NW Vegas", new LatLon(36.246499, -115.290328), 1000);

// deploy drones evenly
config();
if (!process.env.CHANNEL_KEY_DRONE_POSITION
    || ! process.env.CHANNEL_KEY_DRONE_EVENT
    || ! process.env.CHANNEL_KEY_CONTROL_EVENT) {
    console.error("You must set CHANNEL_KEY_DRONE_POSITION, CHANNEL_KEY_DRONE_EVENT and CHANNEL_KEY_CONTROL_EVENT env variables");
}

console.log("deploying drones...");
const drones = Object.keys(hang.drones)

const deployer = setInterval(() => {
    const id = drones.pop();
    if (id) {
        console.log("deploying %s", id);
        (parseInt(id, 10) % 2) ? hang.deployDrone(id, distNE) : hang.deployDrone(id, distNW);
    } else {
        clearInterval(deployer);
    }
}, 133);
