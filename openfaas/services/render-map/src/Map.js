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

        var url = baseURL+ apiBaseUrl + "/function/db-reader/positions-geojson";

        this.map = new mapboxgl.Map({
            container: this.mapContainer,
            style: 'mapbox://styles/mapbox/streets-v9',
            accessToken: 'pk.eyJ1IjoiYWxleGVsbGlzdWsiLCJhIjoiY2s0MnpmZmgyMDJmeTNlb3g1bnBhZXM2cyJ9.I1q17Oz6_aWUie_ObECqrg',
            center: [this.state.lng, this.state.lat],
            zoom: this.state.zoom
        });

        this.map.on('load', () => {
            var mapp = this.map;

            window.setInterval(function() {
                mapp.getSource('drones').setData(url);
            }, 1500);

            this.map.addSource('drones', {
                type: 'geojson',
                data: url,
                // cluster: true
            });

            this.map.addLayer({
                'id': 'drone',
                'type': 'symbol',
                'source': 'drones',
                // 'filter': ['!', 'has', 'point_count'],
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

