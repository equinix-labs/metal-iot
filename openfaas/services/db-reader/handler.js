"use strict"

const { Client } = require('pg')
const Pool = require('pg').Pool
const fs = require('fs')

const pool = initPool()

module.exports = async (event, context) => {
    let client = await pool.connect()

    if(event.method == "GET") {
        if(event.path && event.path.indexOf("events")>-1) {
            let {rows} = await selectEvents(client);
            client.release()
            return context.status(200).succeed({"status": "OK", "data": rows});
        } else if(event.path && (event.path.indexOf("positions")>-1 || event.path.indexOf("positions-geojson")> -1)) {
            let {rows} = await selectPositions(client);
            client.release()

            if(event.path.indexOf("positions-geojson") > -1) {
                var features = [];

                rows.forEach(l => {
                    features.push({
                        'id': l.name,
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Point',
                            'coordinates': [
                                l.location.x,
                                l.location.y
                            ]
                        },
                        'properties': {
                            "title": l.name,
                            "description": `<dl><dt>Location:</dt><dd>Lat: ${l.location.x}</dd><dd>Long: ${l.location.y}</dd><dt>Destination:</dt><dd>Lat: ${l.destination.x}</dd><dd>Long: ${l.destination.y}</dd></dl><div>Temperature: ${l.temp_celsius.toFixed(2)}&#8451;</div><div>Battery: ${l.battery_percent}%</div>`,
                            "icon": "airfield"
                        }
                    });
                });
                let payload = {
                    'type': 'FeatureCollection',
                    'features': features
                };

                return context
                .status(200)
                .succeed(payload);
            }

            return context.status(200).succeed({"status": "OK", "data": rows});
        }
    }
    
    client.release()
    return context.status(200).succeed({"status": "No action"});
}

async function selectEvents(client) {
    let res = await client.query(`select * from drone_event;`)
    return res;
}

async function selectPositions(client) {
    let res = await client.query(`select * from get_latest_positions() ORDER BY name;`)
    return res;
}

function initPool() {
  return new Pool({
    user: fs.readFileSync("/var/openfaas/secrets/db-username", "utf-8"),
    host: fs.readFileSync("/var/openfaas/secrets/db-host", "utf-8"),
    database: process.env["db_name"],
    password: fs.readFileSync("/var/openfaas/secrets/db-password", "utf-8"),
    port: process.env["db_port"],
  });
 }
