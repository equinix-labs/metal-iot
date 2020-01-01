const emitter = require('emitter-io')
const commander = require('commander')

commander.option('-p, --port <port>', 'port')
         .option('-h, --host <host>', 'host')
         .option('-s, --secure', false)
         .option('-c, --channel <channel>')
         .option('-k, --key <key>', 'key')

commander.parse(process.argv)

const client = emitter.connect({ host: commander.host, port: +commander.port, secure: !! commander.secure })
client.on('error', error => console.log(error.stack))
const keys = {}
client.on('keygen', response => {
    keys[response.channel] = response.key
    console.log(response.key)
    client.disconnect()
})
client.keygen({
    key: commander.key,
    channel: commander.channel,
    type: 'rwls',
    ttl: 0
})
