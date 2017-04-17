const utp = require('utp')
const Bufsp = require('bufsp')
const inherits = require('util').inherits
const EventEmitter = require('events').EventEmitter
const IPCServer = require('./ipc-server')

function Connections (options) {
  if (!(this instanceof Connections)) return new Connections(options)
  this._createTCPServer(options)
  this._clients = {}
}

Connections.prototype.connect = function connect (id, options) {
  const remoteAddress = options.host + ':' + options.port
  const client = utp.connect(options.port, options.host)
  console.log(`Connected to ${remoteAddress}`)
  this._clients[id] = client
  // client.on('data', (data) => {
  //   console.log(data.toString())
  //   client.end()
  // })
  client.on('end', () => {
    console.log(`Disconnected from ${remoteAddress}`)
    delete this._clients[id]
  })

  client.on('error', (err) => {
    console.log(`Connection ${remoteAddress} error: ${err.message}`)
  })
}

Connections.prototype.exit = function exit (id) {
  this._clients[id].end()
}

Connections.prototype.send = function send (id, message, options) {
  const bufferFrameEncoder = new Bufsp()
  console.log(id, message)
  debugger
  this._clients[id].write(bufferFrameEncoder.encode(JSON.stringify(message)))
}

inherits(Connections, EventEmitter)

Connections.prototype._createTCPServer = function createTCPServer (options) {
  const self = this
  this._server = utp.createServer()
  this._server.on('connection', handleConnection)

  this._server.listen(options.port, () => {
    console.log('TCP server listening on', this._server.address())
  })

  function handleConnection (conn) {
    const remoteAddress = conn.remoteAddress + ':' + conn.remotePort
    console.log(`Client connected from ${remoteAddress}`)
    const bufferFrameDecoder = new Bufsp({returnString: true})

    bufferFrameDecoder.on('data', onConnData)
    conn.pipe(bufferFrameDecoder)
    conn.once('close', onConnClose)
    conn.on('error', onConnError)

    function onConnData (d) {
      self.emit(IPCServer.operations.message, d)
    }

    function onConnClose () {
      console.log(`Client connection ${remoteAddress} closed`)
    }

    function onConnError (err) {
      console.log(`Client connection ${remoteAddress} error: ${err.message}`)
    }
  }
}

module.exports = Connections
