import React from 'react';
import mapboxgl from 'mapbox-gl';
import { WarehouseOverlay } from './WarehouseOverlay.js'

export class Map extends React.Component {
    constructor(props) {
        super(props);

        const start = {lat: 36.2518992, lon: -115.1660519}

        this.state = {
            lng: start.lon,
            lat: start.lat,
            zoom: 10
        };

        var baseURL, apiBaseUrl;
        if (process && process.env && process.env.NODE_ENV === 'development') {
            baseURL = 'http://localhost:3000';
            apiBaseUrl = '';
        } else {
            baseURL = "";
            apiBaseUrl = "";
        }

        this.positionsUrl = baseURL + apiBaseUrl + "/function/db-reader.openfaas-fn/positions-geojson";
        this.publisherUrl = baseURL + apiBaseUrl + "/function/mqtt-publisher.openfaas-fn";
    }

    componentDidMount() {
        this.setState({isLoading: false});

        this.map = new mapboxgl.Map({
            container: this.mapContainer,
            style: 'mapbox://styles/mapbox/streets-v9',
            accessToken: 'pk.eyJ1IjoiYWxleGVsbGlzdWsiLCJhIjoiY2s0MnpmZmgyMDJmeTNlb3g1bnBhZXM2cyJ9.I1q17Oz6_aWUie_ObECqrg',
            center: [this.state.lng, this.state.lat],
            zoom: this.state.zoom
        });

        let map = this.map

        map.addControl(new mapboxgl.NavigationControl());

        // let feature = map.queryRenderedFeatures({ layers: ['selected-drone'] })[0]

        map.on('load', () => {
            window.setInterval(function() {
                map.getSource('drones').setData(this.positionsUrl);
            }.bind(this), 1500);

            map.addSource('drones', {
                type: 'geojson',
                data: this.positionsUrl,
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

            map.addSource('drones', {
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
                      "title": "dummy cylon",
                      "description": `<dl><dt>Location:</dt><dd>Lat: ${l.location.x}</dd><dd>Long: ${l.location.y}</dd><dt>Destination:</dt><dd>Lat: ${l.destination.x}</dd><dd>Long: ${l.destination.y}</dd></dl><div>Temperature: ${l.temp_celsius.toFixed(2)}&#8451;</div><div>Battery: ${l.battery_percent}%</div>`,
                      "icon": "airfield",
                      "sick": true
                    }
                  }]
                }
            });
            */

            map.addLayer({
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

            map.addLayer({
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
                        'coordinates': [-115.135846, 36.240648]
                      },
                      'properties': {
                          'title': 'NE Vegas'
                      }
                    },
                    {
                      'type': 'Feature',
                      'geometry': {
                        'type': 'Point',
                        // 'coordinates': [-115.290328, 36.246499]
                        // 'coordinates': [-115.125846, 36.240648]
                        'coordinates': [-115.268259, 36.264499]
                      },
                      'properties': {
                          'title': 'NW Vegas'
                      }
                    }
                  ]
                }
              },
              'layout': {
                'icon-image': 'castle-11',
                'text-field': ['get', 'title'],
                'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                'text-offset': [0, 0.6],
                'text-anchor': 'top',
                'icon-allow-overlap': true,
                'text-allow-overlap': true
              }
            })

            map.addLayer({
                'id': 'drones',
                'type': 'symbol',
                'source': 'drones',
                'layout': {
                    'icon-image': 'airfield-11',
                    'text-field': ['get', 'title'],
                    'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                    'text-offset': [0, 0.6],
                    'text-anchor': 'top',
                    'icon-allow-overlap': true,
                    'icon-optional': true,
                    'text-allow-overlap': true,
                    'icon-ignore-placement': true
                },
                'paint': {
                }
            });

            /*
            map.addLayer({
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

            map.addLayer({
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

            map.on('layeradd', function(e) {
                var marker = e.layer,
                    feature = marker.feature;
                marker.setIcon(map.icon(feature.properties.icon));
            });

            map.on('move', () => {
                this.setState({
                    lng: map.getCenter().lng.toFixed(4),
                    lat: map.getCenter().lat.toFixed(4),
                    zoom: map.getZoom().toFixed(2)
                });
            });

            map.on('click', 'drones', function(e) {
                let coordinates = e.features[0].geometry.coordinates.slice();
                let title = e.features[0].properties.title;
                let description = e.features[0].properties.description;
                let popup = new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(`<h2>${title}</h2>${description}<br><button type="button" id="return-to-hangar">Return to hangar</button>`)
                    .addTo(map);
                let returnToHangar = document.getElementById("return-to-hangar")
                returnToHangar.addEventListener('click', function(e) {
                    popup.remove();
                    fetch(this.publisherUrl, {
                        method: 'POST',
                        headers: { 'Content-type': 'application/json' },
                        body: JSON.stringify({ data: {}, filter: { name: title }, type: 'cancel' })
                    })
                    alert(`Message sent to ${title} to return to hangar.`)
                })
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
                <WarehouseOverlay publisherUrl={this.publisherUrl} />
            </div>
        )
    }
}

