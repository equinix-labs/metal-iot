import { config } from "dotenv";
import { connect, ConnectRequest, Emitter, EmitterMessage } from 'emitter-io';

config();
if (!process.env.CHANNEL_KEY_DRONE_POSITION || ! process.env.CHANNEL_KEY_DRONE_EVENT) {
    console.error("You must set CHANNEL_KEY_DRONE_POSITION and CHANNEL_KEY_DRONE_EVENT env variables");
}

export class TrafficController {

    private client: Emitter;
    private errors: object;
    private events: object;
    private deliveries: object;
    private fin: object;

    constructor(broker: ConnectRequest) {
        this.errors = {};
        this.events = {};
        this.deliveries = {};
        this.fin = {};
        this.client = connect(broker, () => {
            console.log("connected to data feed");

            /*this.client.subscribe({
                channel: "drone-position",
                key: process.env.CHANNEL_KEY_DRONE_POSITION || "",
            });*/

            this.client.subscribe({
                channel: "drone-event",
                key: process.env.CHANNEL_KEY_DRONE_EVENT || "",
            });

            this.client.on("message", (msg: EmitterMessage) => {
                console.log(msg.asString());
                console.log(msg.channel);
                if (msg.channel === "drone-position/") {
                    return;
                }
                const obj = msg.asObject();
                if (obj.type === "system_error") {
                    // @ts-ignore: Unreachable code error
                    this.errors[obj.data.message] =
                        // @ts-ignore: Unreachable code error
                        this.errors[obj.data.message] && this.errors[obj.data.message] + 1 || 1;
                } else {
                    // @ts-ignore: Unreachable code error
                    this.events[obj.data.name] = this.events[obj.data.name] || {};
                    // @ts-ignore: Unreachable code error
                    this.events[obj.data.name][obj.type] =
                        // @ts-ignore: Unreachable code error
                        this.events[obj.data.name][obj.type] && this.events[obj.data.name][obj.type] + 1 || 1;
                }

                if (obj.type === "package_delivered") {
                    // @ts-ignore: Unreachable code error
                    this.deliveries[obj.data.name] = this.deliveries[obj.data.name] || [];
                    // @ts-ignore: Unreachable code error
                    this.deliveries[obj.data.name].push(obj.data);
                }

                if (obj.type === "drone_grounded") {
                    // @ts-ignore: Unreachable code error
                    this.fin[obj.data.name] = {
                        batteryPercent: obj.data.batteryPercent,
                        // @ts-ignore: Unreachable code error
                        deliveriesCompleted: this.deliveries[obj.data.name] && this.deliveries[obj.data.name].length,
                    };
                    console.log("\n\Drone Returned to Hangar - deliveries completed");
                    // @ts-ignore: Unreachable code error
                    console.log(this.deliveries[obj.data.name] || "None");
                }
            });
        });
    }

    public async monitor() {
        while (true) {
            console.log("System Error Counts");
            console.log(this.errors);

            console.log("\n\nEvent Counts");
            console.log(this.events);

            console.log("\n\nFinishers");
            console.log(this.fin);
            await new Promise((resolve) => setTimeout(resolve, 30000));
        }
    }
}

const listener = new TrafficController({
    host: process.env.EMITTER_HOST || "127.0.0.1",
    port: parseInt(process.env.EMITTER_PORT || "8080", 10),
});

listener.monitor();
