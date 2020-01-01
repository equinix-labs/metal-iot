const Publisher = require('./publisher')

const publisher = new Publisher({ host: '127.0.0.1', port: 8083, channels: {
    'drone-position': process.env.DRONE_POSITION_KEY
} })

setTimeout(() => {
publisher.publish({
    channel: 'drone-position',
    message: 'hello, world'
})
}, 500)
