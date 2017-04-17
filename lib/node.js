const kad = require('kad')
const uuidV4 = require('uuid/v4')
const TCPConnections = require('./tcp-connections')
const IPCServer = require('./ipc-server')

function Node (options) {
  if (!(this instanceof Node)) return new Node(options)
  this._options = options
  this._keys = options.keys
  this._seed = options.seed
  this._dht = new kad.Node({
    transport: kad.transports.UDP(kad.contacts.AddressPortContact(options.dht)),
    storage: options.storage
  })
  this._tcpConns = new TCPConnections(options.chat)
  this._ipc = new IPCServer(options.ipc)

  // Setup event listeners
  this._ipc.on(IPCServer.operations.exit, this._onExit.bind(this))
  this._ipc.on(IPCServer.operations.join, this._onJoin.bind(this))
  this._ipc.on(IPCServer.operations.message, this._onSendMessage.bind(this))

  this._tcpConns.on(IPCServer.operations.message, this._onReceivedMessage.bind(this))
}

Node.prototype.connect = function connect () {
  this._dht.connect(this._seed, (err) => {
    if (err) throw err

    // Set key in dht
    this._dht.put(this._keys.public, JSON.stringify(this._options.chat), (err) => {
      if (err) throw err
    })
  })
  this._ipc.start((err) => {
    if (err) throw err
  })
}

Node.prototype._onJoin = function onJoin (command) {
  const key = command.params.room
  this._dht.get(key, (err, result) => {
    if (err) throw err
    this._tcpConns.connect(key, JSON.parse(result))
  })
}

Node.prototype._onExit = function onExit (command) {
  const key = command.params.room
  this._tcpConns.exit(key)
}

Node.prototype._onSendMessage = function onSendMessage (command) {
  console.log('SEND MESSAGE')
  const key = command.params.room
  this._tcpConns.send(key, command)
}

Node.prototype._onReceivedMessage = function onReceivedMessage (command) {
  console.log('RECEIVED MESSAGE')
  this._ipc.send(command)
}

Node.prototype._onRequest = function onRequest (command) {
  console.log('REQUEST')
  const key = uuidV4()

}

module.exports = Node
