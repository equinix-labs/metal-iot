"use strict"

const fs = require('fs')
const Publisher = require('./publisher')

const channels = {
    'control-event': fs.readFileSync('/var/openfaas/secrets/control-event-key', 'utf-8'),
    'drone-position': fs.readFileSync('/var/openfaas/secrets/drone-position-key', 'utf-8'),
    'drone-event': fs.readFileSync('/var/openfaas/secrets/drone-position-key', 'utf-8')
}

const publisher = new Publisher({
    host: 'emitter.openfaas.svc.cluster.local',
    port: 8080,
    channels
})

module.exports = async (event, context) => {
    if (event.method == 'POST') {
        publisher.publish({ channel: 'control-event', message: event.body })
        return context.status(200).succeed({"status": "Published"});
    }

    return context.status(200).succeed({"status": "No action"});
}
