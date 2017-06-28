const uuidV4 = require('uuid/v4')
const Ipfs = require('ipfs')
const IPCServer = require('./ipc-server')

function Node (options) {
  if (!(this instanceof Node)) return new Node(options)
  this._options = options
  this._ipc = new IPCServer(options.ipc)
  this._ipfs = new Ipfs({
    init: true, // default
    // init: false,
    // init: {
    //   bits: 1024 // size of the RSA key generated
    // },
    start: false,
    // start: false,
    EXPERIMENTAL: { // enable experimental features
      pubsub: true
    }
  })

  // Setup event listeners
  // this._ipfs.on('ready', () => console.log('[IPFS] Ready!'))
  this._ipfs.on('error', (err) => console.log('[IPFS] Error', err)) // Node has hit some error while initing/starting

  this._ipfs.on('init', () => console.log('[IPFS] Initialized'))     // Node has successfully finished initing the repo
  this._ipfs.on('start', () => console.log('[IPFS] Started'))    // Node has started
  this._ipfs.on('stop', () => console.log('[IPFS] Stopped'))     // Node has stopped

  this._ipc.on('message', this._onSendMessage.bind(this))
  this._ipc.on('join', this._onJoin.bind(this))
}

Node.prototype.connect = function connect () {
  this._ipfs.on('ready', () => {
    this._ipfs.start((err) => {
      if (err) throw err
      this._ipfs.pubsub.subscribe('p2p-chat/control', {},
        this._onMessage.bind(this, 'control'),
        () => console.log('[IPFS] PUBSUB ready!')
      )
    })
  })

  this._ipc.start((err) => {
    if (err) throw err
  })
}

Node.prototype._onJoin = function onJoin (data) {
  const room = data.params.room
  console.log(data)
  this._ipfs.pubsub.subscribe(`p2p-chat/${room}`, this._onMessage.bind(this, room),
    (err) => {
      if (err) throw err
    })
}

Node.prototype._onExit = function onExit (data) {
  const room = data.params.room
  this._ipfs.pubsub.unsubscribe(`p2p-chat/${room}`, this._onMessage)
}

Node.prototype._onSendMessage = function onSendMessage (data) {
  const room = data.params.room
  const message = data.payload
  this._ipfs.pubsub.publish(room, Buffer.from(message, 'utf8'), (err) => {
    if (err) console.log(err)
  })
}

Node.prototype._onMessage = function onMessage (topic, msg) {
  const { from, data } = msg
  const message = data.toString('utf8')
  console.log(msg)
  this._ipcServer.send({
    op: 'message',
    from,
    message
  })
}

module.exports = Node
