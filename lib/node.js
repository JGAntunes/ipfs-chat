const kad = require('kad')
const uuidV4 = require('uuid/v4')
const config = require('../config')
const storage = require('./storage')
const TCPConnections = require('./tcp-connections')
const IPCServer = require('./ipc-server')
const commandCli = require('vorpal')()
const chatCli = require('vorpal')()

function Node (options) {
  if (!(this instanceof Node)) return new Node(options)
  this._options = options
  this._seed = options.seed
  this._dht = new kad.Node({
    transport: kad.transports.UDP(kad.contacts.AddressPortContact(options.dht)),
    storage: options.storage
  })
  this._tcpConns = new TCPConnections(options.chat)
  this._ipc = new IPCServer(options.ipc)

  // Setup event listeners
  this._ipc.on(IPCServer.exit, this._onExit.bind(this))
  this._ipc.on(IPCServer.join, this._onJoin.bind(this))
  this._ipc.on(IPCServer.message, this._onMessage.bind(this))
  this._ipc.on(IPCServer.create, this._onCreate.bind(this))
}

Node.prototype.connect = function connect () {
  this._dht.connect(this._seed, (err) => {
    if (err) throw err
  })
  this._ipc.start((err) => {
    if (err) throw err
  })
}

Node.prototype._onJoin = function onJoin (command) {
  const key = command.args.room
  this._dht.get(key, (err, result) => {
    if (err) throw err
    this._tcpConns.connect(key, JSON.parse(result))
  })
}

Node.prototype._onExit = function onExit (command) {
  const key = command.args.room
  this._tcpConns.exit(key)
}

Node.prototype._onMessage = function onMessage (command) {
  const key = command.args.room
  const message = command.args.message
  this._tcpConns.send(key, message)
}

Node.prototype._onCreate = function onCreate (command) {
  const key = uuidV4()
  this._dht.put(key, JSON.stringify(this._options.chat), (err) => {
    if (err) throw err
  })
}
