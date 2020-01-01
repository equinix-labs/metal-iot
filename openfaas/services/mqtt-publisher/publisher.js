const emitter = require('emitter-io')

class Publisher {
    constructor (options) {
        this.channels = options.channels
        this.client = emitter.connect({
            host: options.host,
            port: options.port,
            secure: !! options.secure
        })
        this.client.on('error', error => console.log(error.stack))
        this.client.on('connect', function () { console.log(arguments) })
        this.client.on('offline', function () { console.log('offline', arguments) })
    }

    publish (options) {
        console.log(this.channels, options)
        this.client.publish({
            channel: options.channel,
            key: this.channels[options.channel],
            message: JSON.stringify(options.message),
            me: false
        })
    }
}

module.exports = Publisher
