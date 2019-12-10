## OpenFaaS Services

### Inventory

* db-inserter

    Reads an MQTT message and inserts it into a Postgres table

    The following connects the function to the MQTT topic via the Emitter broker:

    ```yaml
        annotations:
        topic: "drone-position/"
    ```

* db-reader

    Reads positions of the drones ingested so far

* render-map

    Static webpage that renders mapbox locations using the `db-reader` endpoint

### Deployment

* You will need to create a secret for Postgres with the login information:

    ```sh
    faas-cli secret create db --literal db-username="" --literal db-password="" --literal db-uri=""
    ```

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