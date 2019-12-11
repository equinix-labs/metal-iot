## OpenFaaS Services

### Inventory

* db-inserter

    Reads an MQTT message and inserts it into a Postgres table

    The following connects the function to the MQTT topic via the Emitter broker:

    ```yaml
        annotations:
        topic: "drone-position/"
    ```

    ```sh
    curl 127.0.0.1:8080/function/db-inserter \
    --data '{"name": "Wireguard", "tempCelsius": 8.5, "location": {"lat": 25.6, "lon": 52.4}, "batteryMv": 4800}' \
    -H "Content-Type: application/json"
    ```

* db-reader

    Reads positions of the drones ingested so far

* render-map

    Static webpage that renders mapbox locations using the `db-reader` endpoint

### Deployment

* You will need to create a secret for Postgres with the login information:

    ```sh
    export USER="postgres"
    export PASS=""
    export HOST="postgresql.default.svc.cluster.local"

    kubectl create secret generic -n openfaas-fn db \
      --from-literal db-username="$USER" \
      --from-literal db-password="$PASS" \
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

* Rebuild the stack if you want

    Use an environment variable to specify your own Docker Hub Account [as per the docs](https://docs.openfaas.com/reference/yaml/#yaml-environment-variable-substitution)

    ```sh
    export DOCKER_USER="some-user"

    faas-cli up
    ```

* Debug

    Did the version not change? Alter `latest` to a version like `0.1.1` for each change.

    Are you not sure what went wrong? Try `faas-cli logs NAME`

    Want to add print statements? Try adding: `console.log("Got here..")`

