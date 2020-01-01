const emitter = require('emitter-io')

const client = emitter.connect({ host: '127.0.0.1', port: 8083, secure: false })

client.on('message', message => {
    console.log({
        channel: message.channel,
        body: String(JSON.parse(message.binary))
    })
})
client.subscribe({
    key: process.env.EMITTER_CHANNEL_KEY,
    channel: process.env.EMITTER_CHANNEL
})
