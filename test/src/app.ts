import { config } from "dotenv";
import LatLon from "geodesy/latlon-spherical.js";
import { Hangar } from "./hangar";
import { Warehouse } from "./warehouse";

const hang = new Hangar("area51", new LatLon(36.264869, -115.164221), 10);
const distNE = new Warehouse("NE Vegas", new LatLon(36.250648, -115.124846), 5000);
const distNW = new Warehouse("NW Vegas", new LatLon(36.246499, -115.290328), 5000);

// deploy drones evenly
config();
console.log(process.env.CHANNEL_KEY_STATUS);

console.log("deploying drones...");
const drones = Object.keys(hang.drones)

const deployer = setInterval(() => {
    const id = drones.pop();
    console.log("deploying %s", id);
    if (id) {
        (parseInt(id, 10) % 2) ? hang.deployDrone(id, distNE) : hang.deployDrone(id, distNW);
    } else {
        clearInterval(deployer);
    }
}, 3133);
