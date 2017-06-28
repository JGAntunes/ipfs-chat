const kad = require('kad')
const uuidV4 = require('uuid/v4')
const Ipfs = require('ipfs')

function Node (options) {
  if (!(this instanceof Node)) return new Node(options)
  this._options = options
  this._ipfs = new Ipfs({
    init: true, // default
    // init: false,
    // init: {
    //   bits: 1024 // size of the RSA key generated
    // },
    start: true,
    // start: false,
    EXPERIMENTAL: { // enable experimental features
      pubsub: true
    }
  })

  // Setup event listeners
  this._ipfs.on('ready', () => {
    this._ipfs.pubsub.subscribe('p2p-chat/control', {},
      this._onMessage.bind(this, 'control'),
      () => console.log('Ready!')
    )
  })
}

// Node.prototype.connect = function connect () {
//   this._dht.connect(this._seed, (err) => {
//     if (err) throw err
//
//     // Set key in dht
//     this._dht.put(this._keys.public, JSON.stringify(this._options.chat), (err) => {
//       if (err) throw err
//     })
//   })
//   this._ipc.start((err) => {
//     if (err) throw err
//   })
// }

Node.prototype._onJoin = function onJoin (command) {
  const room = command.params.room
  this._ipfs.subscribe(`p2p-chat/${room}`, this._onMessage.bind(this, room),
    (err) => {
      if (err) throw err
    })
}

Node.prototype._onExit = function onExit (command) {
  const room = command.params.room
  this._ipfs.unsubscribe(`p2p-chat/${room}`, this._onMessage)
}

Node.prototype._onSendMessage = function onSendMessage (command) {
  const { room, message } = command.params
  this._ipfs.publish(room, message, (err) => {
    if (err) console.log(err)
  })
}

Node.prototype._onMessage = function onMessage (topic, msg) {
  const { from, data } = msg
  const message = data.toString('utf8')
  this._ipcServer.send({
    op: 'message',
    from,
    message
  })
}

module.exports = Node
