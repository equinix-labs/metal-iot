## OpenFaaS Services

### Overview

* db-inserter

    Reads an MQTT message and inserts it into a Postgres table

    The following connects the function to the MQTT topic via the Emitter broker:

    ```yaml
        annotations:
        topic: "drone-position/"
    ```

    ```sh

    # Delivering candles to the Peterborough Cathedral
    curl 127.0.0.1:8080/function/db-inserter \
    --data '{"name": "Halo", "tempCelsius": 8.5, "location": {"lat":  52.5724835, "lon": -0.2392101}, "destination": {"lat":  52.5724835, "lon": -0.2392101}, "batteryPercent": 80}' \
    -H "Content-Type: application/json"

    # Delivering cucumbers to the market
    curl 127.0.0.1:8080/function/db-inserter \
    --data '{"name": "Market-watch", "tempCelsius": 8.5, "location": {"lat":  52.5736589, "lon": -0.2400627}, "destination": {"lat":  52.5724835, "lon": -0.2392101}, "batteryPercent": 80}' \
    -H "Content-Type: application/json"

    # Dropping off ice-cream to the outdoor pool
    curl 127.0.0.1:8080/function/db-inserter \
    --data '{"name": "Pool-watch", "tempCelsius": 8.5, "location": {"lat":  52.5700276, "lon": -0.2384085}, "destination": {"lat":  52.5724835, "lon": -0.2392101}, "batteryPercent": 80}' \
    -H "Content-Type: application/json"
    ```

* db-reader

    Reads positions and events of the drones ingested so far

    GET `/events` - read the `drone_event` table in JSON

    ```sh
    curl -s 127.0.0.1:8080/function/db-reader/events
    ```

    GET `/positions` - read the `drone_position` table in JSON

    ```sh
    curl -s 127.0.0.1:8080/function/db-reader/positions
    ```

    GET `/positions-geojson` - return geoJSON to be used with a feed or external API

    ```
    curl -s 127.0.0.1:8080/function/db-reader/positions-geojson
    ```

    ```json
    {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                    -0.2392101,
                    52.5724835
                    ]
                },
                "properties": {
                    "title": "Halo",
                    "icon": "airfield"
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                    -0.2400627,
                    52.5736589
                    ]
                },
                "properties": {
                    "title": "Market-watch",
                    "icon": "airfield"
                }
            },
        ]
    }
    ```

* mqtt-publisher

    Broadcasts a POST body as an MQTT message on the `control-event/` channel.  Content of the message is left up to the publishers and consumers - the example below references the [cancel control event](/test/client#event-type-cancel).
    
    ```sh

    # Send all drones servicing the NE Vegas warehouse back to the hangar 
    curl 127.0.0.1:8080/function/mqtt-publisher \
    --data '{"type": "cancel", "filter": {"warehouse":  "NE Vegas"}, "data": {}}' \
    -H "Content-Type: application/json"
    ```

* render-map

    Static webpage assets generated from a webpack build. The webpage is written in React and renders locations from the `db-reader` endpoint using GeoJSON.

    Find out more about [Mapbox GL JS + React](https://blog.mapbox.com/mapbox-gl-js-react-764da6cc074a)

    See also: [render-map README](render-map/)

### Deployment

* You will need to create a secret for Postgres with the login information:

    ```sh
    export USER="postgres"
    export HOST="postgresql.default.svc.cluster.local"
    # export POSTGRES_PASSWORD=""  # Set this value or take it from the earlier step

    kubectl create secret generic -n openfaas-fn db \
      --from-literal db-username="$USER" \
      --from-literal db-password="$POSTGRES_PASSWORD" \
      --from-literal db-host="$HOST"
    ```

* Create the schema

    Use the `psql` command you got in the Postgres installation step to create the database schema held in the `openfaas/services/schema.sql` file.

* Deploy the stack

    ```sh
    cd openfaas/services

    faas-cli deploy
    ```

    Use `--filter NAME` to deploy only one function at a time

* Rebuild the stack if you want (optional)

    Use an environment variable to specify your own Docker Hub Account [as per the docs](https://docs.openfaas.com/reference/yaml/#yaml-environment-variable-substitution)

    ```sh
    export DOCKER_USER="some-user"

    faas-cli up
    ```

    You can build a single service at a time with `--filter`

    ```sh
    faas-cli up --filter db-inserter
    ```

* Debug

    Did the version not change? Alter `latest` to a version like `0.1.1` for each change.

    Are you not sure what went wrong? Try `faas-cli logs NAME`

    Want to add print statements? Try adding: `console.log("Got here..")`

