## render-map

![](/docs/images/map-render.png)

## Local testing:

* Port-forward OpenFaaS

    ```sh
    kubectl port-forward -n openfaas svc/gateway 8080:8080
    ```

* Start a local server

    ```sh
    npm start
    ```

    View the site at http://127.0.0.1:3000

    The `axios` module will be used to call back into `db-reader`, during development this uses the react proxy. As a production deployment (below), it uses the OpenFaaS gateway URL.

### Mapbox reference

    * Mapbox GL JS + React - https://docs.mapbox.com/help/tutorials/use-mapbox-gl-js-with-react/

    * GeoJSON and other drawing - https://docs.mapbox.com/mapbox-gl-js/example/geojson-markers/

    * Use Mapbox GL JS in a React app - https://blog.mapbox.com/mapbox-gl-js-react-764da6cc074a

## Deploying to production:

    ```sh
    faas-cli up --filter render-map
    ```
