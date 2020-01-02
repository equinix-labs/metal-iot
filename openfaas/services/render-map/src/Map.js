import React from 'react';
import mapboxgl from 'mapbox-gl';

export class Map extends React.Component {
    constructor(props) {
        super(props);

        const start = {lat: 36.2518992, lon: -115.1660519}

        this.state = {
            lng: start.lon,
            lat: start.lat,
            zoom: 10
        };
    }

    componentDidMount() {
        this.setState({isLoading: false});

        var baseURL, apiBaseUrl;
        if (process && process.env && process.env.NODE_ENV === 'development') {
            baseURL = 'http://localhost:3000';
            apiBaseUrl = '';
        } else {
            baseURL = "";
            apiBaseUrl = "";
        }

        var url = baseURL+ apiBaseUrl + "/function/db-reader.openfaas-fn/positions-geojson";

        this.map = new mapboxgl.Map({
            container: this.mapContainer,
            style: 'mapbox://styles/mapbox/streets-v9',
            accessToken: 'pk.eyJ1IjoiYWxleGVsbGlzdWsiLCJhIjoiY2s0MnpmZmgyMDJmeTNlb3g1bnBhZXM2cyJ9.I1q17Oz6_aWUie_ObECqrg',
            center: [this.state.lng, this.state.lat],
            zoom: this.state.zoom
        });

        this.map.addControl(new mapboxgl.NavigationControl());

        this.map.on('load', () => {
            window.setInterval(function() {
                this.map.getSource('drones').setData(url);
            }.bind(this), 1500);

            this.map.addSource('drones', {
                type: 'geojson',
                data: url,
                // cluster: true
            });

            /*
            let l = {
              temp_celsius: 25.1391496933256,
              battery_percent: 98,
              location: {
                x: -115.125846,
                y: 36.240648
              },
              destination: {
                x: -115.12396469988,
                y: 36.2337435706823
              }
            }

            this.map.addSource('drones', {
                type: 'geojson',
                data: {
                  type: "FeatureCollection",
                  features: [{
                    "type": "Feature",
                    "geometry": {
                      "type": "Point",
                      "coordinates": [
                        -115.174320057414,
                        36.2634030641911
                      ]
                    },
                    "properties": {
                      "title": "cylon 0",
                      "description": `<dl><dt>Location:</dt><dd>Lat: ${l.location.x}</dd><dd>Long: ${l.location.y}</dd><dt>Destination:</dt><dd>Lat: ${l.destination.x}</dd><dd>Long: ${l.destination.y}</dd></dl><div>Temperature: ${l.temp_celsius.toFixed(2)}&#8451;</div><div>Battery: ${l.battery_percent}%</div><a href="${sendToHangar}" class="send-to-hangar">Send to hangar</a>`,
                      "icon": "airfield"
                    }
                  }]
                }
            });
            */

            this.map.addLayer({
              'id': 'hangar',
              'type': 'symbol',
              'source': {
                'type': 'geojson',
                'data': {
                  'type': 'FeatureCollection',
                  'features': [
                    {
                      'type': 'Feature',
                      'geometry': {
                        'type': 'Point',
                        'coordinates': [-115.164221, 36.264869]
                      }
                    }
                  ]
                }
              },
              'layout': {
                'icon-image': 'castle-11',
                'text-field': 'Hangar',
                'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                'text-offset': [0, 0.6],
                'text-anchor': 'top',
                'icon-allow-overlap': true,
                'text-allow-overlap': true,
                'icon-ignore-placement': true
              }
            })

            this.map.addLayer({
              'id': 'warehouses',
              'type': 'symbol',
              'source': {
                'type': 'geojson',
                'data': {
                  'type': 'FeatureCollection',
                  'features': [
                    {
                      'type': 'Feature',
                      'geometry': {
                        'type': 'Point',
                        'coordinates': [-115.124846, 36.250648]
                      }
                    },
                    {
                      'type': 'Feature',
                      'geometry': {
                        'type': 'Point',
                        'coordinates': [-115.290328, 36.246499]
                      }
                    }
                  ]
                }
              },
              'layout': {
                'icon-image': 'castle-11',
                'text-field': 'Warehouse',
                'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                'text-offset': [0, 0.6],
                'text-anchor': 'top',
                'icon-allow-overlap': true,
                'text-allow-overlap': true
              }
            })

            this.map.addLayer({
                'id': 'drones',
                'type': 'symbol',
                'source': 'drones',
                'layout': {
                    'icon-image': 'airfield-11',
                    // get the title name from the source's "title" property
                    'text-field': ['get', 'title'],
                    'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                    'text-offset': [0, 0.6],
                    'text-anchor': 'top',
                    'icon-allow-overlap': true,
                    'icon-optional': true,
                    'text-allow-overlap': true,
                    'icon-ignore-placement': true
                }
            });

            /*
            this.map.addLayer({
                'id': 'cluster',
                'type': 'circle',
                'source': 'drones',
                'filter': ['has', 'point_count'],
                'paint': {
                    'circle-color': '#ffffff',
                    'circle-opacity': 0.5,
                    'circle-radius': [
                        'step',
                        ['get', 'point_count'],
                        10,
                        2,
                        10,
                        4,
                        20
                    ]
                }
            });

            this.map.addLayer({
                id: 'cluster-count',
                type: 'symbol',
                source: 'drones',
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                    'text-size': 12
                }
            });
            */

            this.map.on('layeradd', function(e) {
                var marker = e.layer,
                    feature = marker.feature;
                marker.setIcon(this.map.icon(feature.properties.icon));
            });

            this.map.on('move', () => {
                this.setState({
                    lng: this.map.getCenter().lng.toFixed(4),
                    lat: this.map.getCenter().lat.toFixed(4),
                    zoom: this.map.getZoom().toFixed(2)
                });
            });

            this.map.on('click', 'drones', function(e) {
              let coordinates = e.features[0].geometry.coordinates.slice();
              let title = e.features[0].properties.title;
              let description = e.features[0].properties.description;
              new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(`<h2>${title}</h2>${description}`)
                .addTo(this.map);
            }.bind(this))

        });
    }

    componentWillUnmount() {
        this.map.remove();
    }

    render() {
        return (
            <div>
            <div ref={el => this.mapContainer = el} className="mapContainer" />
            </div>
        )
    }
}

