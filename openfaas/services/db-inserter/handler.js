"use strict"

const { Client } = require('pg')
const Pool = require('pg').Pool
const fs = require('fs')

const pool = initPool()

module.exports = async (event, context) => {  
    if(event.method == "POST") {

        let dataType = getDataType(event.body)
        // console.log(dataType, event.body);

            if(dataType == "position") {
                let client = await pool.connect()
                try {
                    let {name, location, destination, tempCelsius, batteryPercent} = event.body;

                    let inserted = await insertPosition(client, name, location, destination, tempCelsius, batteryPercent);
                    console.log("Inserted position" + inserted.toString())
        
                } finally {
                    client.release()
                }
                return context.status(200).succeed({"status": "OK"});
            } if(dataType == "event") {
                let client = await pool.connect()

                try {
                    let {eventType, data} = event.body;
                    let inserted = await insertEvent(client, eventType, data);
                    console.log("Inserted event" + inserted.toString())
                } finally {
                    client.release()
                }
                return context.status(200).succeed({"status": "OK"});
            }
        }

    return context.status(200).succeed({"status": "No action"});
}

class Point {
    constructor(point) {
        this.lon = point.lon
        this.lat = point.lat
    }

    toString() {
        return "(" + this.lon+"," + this.lat+")"
    }
}

function getDataType(body) {
    if(body.location) {
        return "position"
    }
    return "event"
}

async function insertPosition(client, name, location, destination, tempCelsius, batteryPercent) {
    let res = await client.query(`insert into drone_position (name, location, destination, temp_celsius, battery_percent) values ($1, $2, $3, $4, $5);`,
    [name, new Point(location).toString(), new Point(destination).toString(), tempCelsius, batteryPercent]);
    return res.rowCount;
}

async function insertEvent(client, eventType, data) {
    let res = await client.query(`insert into drone_event (event_type, data) values ($1, $2);`,
    [eventType, data]);
    return res.rowCount;
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
