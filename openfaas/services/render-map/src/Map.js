import React from 'react';
import mapboxgl from 'mapbox-gl';
import { droneApi } from './api/droneApi';

export class Map extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            lng: -0.2392101,
            lat: 52.5724835,
            zoom: 16,
            locations: []
        };
    }

    componentDidMount() {
        droneApi.fetchLocations()
        .then(res => {
            console.log(droneApi.locations)
            let features = [];
            droneApi.locations.forEach(l => {
                features.push({
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [
                            l.location.x,
                            l.location.y
                        ]
                    },
                    'properties': {
                        'title': l.name,
                        "icon": "airfield"
                        }
                });
            });
            
        this.setState({locations: features, isLoading: false});
        console.log(this.state.locations)
                       
        this.map = new mapboxgl.Map({
            container: this.mapContainer,
            style: 'mapbox://styles/mapbox/streets-v9',
            accessToken: 'pk.eyJ1IjoiYWxleGVsbGlzdWsiLCJhIjoiY2s0MnpmZmgyMDJmeTNlb3g1bnBhZXM2cyJ9.I1q17Oz6_aWUie_ObECqrg',
            center: [this.state.lng, this.state.lat],
            zoom: this.state.zoom
        });

        this.map.on('move', () => {
            this.setState({
                lng: this.map.getCenter().lng.toFixed(4),
                lat: this.map.getCenter().lat.toFixed(4),
                zoom: this.map.getZoom().toFixed(2)
                });
            });

            var baseURL, apiBaseUrl;
            if (process && process.env && process.env.NODE_ENV === 'development') {
                baseURL = 'http://localhost:3000';
                apiBaseUrl = '';
              } else {
                baseURL = "";
                apiBaseUrl = "";
              }
       
            var url = baseURL+ apiBaseUrl + "/function/db-reader/positions-geojson";          

            this.map.on('load', () => {
                var mapp = this.map; 
                window.setInterval(function() {
                    mapp.getSource('drone').setData(url);
                    }, 1500);

                this.map.addSource('drone', { type: 'geojson', data: url });
                this.map.addLayer({
                        'id': 'drone',
                        'type': 'symbol',
                        'source': 'drone',
                        'layout': {
                            'icon-image': 'airfield-11',
                            // get the title name from the source's "title" property
                            'text-field': ['get', 'name'],
                            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                            'text-offset': [0, 0.6],
                            'text-anchor': 'top'
                            }
                    });
                });
                this.map.on('layeradd', function(e) {
                    var marker = e.layer,
                    feature = marker.feature;
                    marker.setIcon(this.map.icon(feature.properties.icon));
            });
        })
        .catch(e => {
            console.error(e);
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
  