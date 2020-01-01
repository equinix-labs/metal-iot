## Drone Controller
Microservice that monitors drone behavior and issues `control-event` commands as needed to prevent airspace violations.

## Getting Started

1. Configure the emitter host variables along with emitter channel keys for `control-event`, `drone-position` and `drone-event`(via OS or .env file).  `EMITTER_HOST` defaults to `127.0.0.1` if not set.  `EMITTER_PORT` defaults to `8080` if not set.

You can work with a local Emitter instance, or you can connect to the version deployed in your cluster using port-forwarding, or the NodePort 30080 and the public IP of one of the nodes.

```sh
export CHANNEL_KEY_DRONE_POSITION="pZtoyNQ_b3WPRc63Br5QJv8CCcP2gfKZ"
export CHANNEL_KEY_DRONE_EVENT="qlnEY07lFKttkvyZbyzshmiDFPQOo232"
export CHANNEL_KEY_CONTROL_EVENT="3Lutukd1Nj1-nPdlKNlIT5tr791G_ofn"
```

Port-forwarding:

```sh
kubectl port-forward -n openfaas svc/emitter 8081:8080 &
```

```sh
export EMITTER_HOST=127.0.0.1
export EMITTER_PORT=8081
```

Local:

```sh
export EMITTER_HOST=172.23.98.23
export EMITTER_PORT=8124
```

2. Launch the controller

    ```sh
    npm i
    npm start
    ```

## Behavior
- Drones that send a `system-error` event are returned to the hangar
- Drones that send a `system-warning` event are temporarily paused at a reduced altitude
- Drones that are flying at similar altitudes in close proximity have their altitude adjusted to avoid collisions