import { config } from "dotenv";
import { TrafficController } from "./atc";

config();
if (!process.env.CHANNEL_KEY_DRONE_POSITION
    || ! process.env.CHANNEL_KEY_DRONE_EVENT
    || ! process.env.CHANNEL_KEY_CONTROL_EVENT) {
    console.error("You must set CHANNEL_KEY_DRONE_POSITION, CHANNEL_KEY_DRONE_EVENT and CHANNEL_KEY_CONTROL_EVENT env variables");
}

const controller = new TrafficController({
    host: process.env.EMITTER_HOST || "127.0.0.1",
    port: parseInt(process.env.EMITTER_PORT || "8080"),
    channels: {
        "control-event": process.env.CHANNEL_KEY_CONTROL_EVENT|| "",
        "drone-event": process.env.CHANNEL_KEY_DRONE_EVENT || "",
        "drone-position": process.env.CHANNEL_KEY_DRONE_POSITION || "",
    }
});

controller.monitor();