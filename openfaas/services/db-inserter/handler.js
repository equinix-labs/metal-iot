"use strict"
const { Client } = require('pg')
const Pool = require('pg').Pool
const fs = require('fs')
var pool;

module.exports = async (event, context) => {
    if(!pool) {
        const poolConf = {
            user: fs.readFileSync("/var/openfaas/secrets/db-username", "utf-8"),
            host: fs.readFileSync("/var/openfaas/secrets/db-host", "utf-8"),
            database: process.env["db_name"],
            password: fs.readFileSync("/var/openfaas/secrets/db-password", "utf-8"),
            port: process.env["db_port"],
        };
        // console.log(poolConf);

        pool = new Pool(poolConf)
    }

    await pool.connect()

    try {
        const res = await pool.query(`CREATE TABLE drone_position (
        positionid        bigint primary key,
        name              text,
        location          point,
        temp_celsius      double precision not null,
        created           timestamp with time zone default now()
    );`)
        console.log(res)
    } catch(e) {
        console.error(e)
    }

    const insertRes = await pool.query(`insert into drone_position (positionid, name, location, temp_celsius) values (1, 'Drone A', point(1,52), 8.5);`)   
    console.log(insertRes)

    await pool.end()

    context.status(200).succeed("OK");
}
