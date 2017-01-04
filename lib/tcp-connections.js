const net = require('net')
const Bufsp = require('bufsp')
const inherits = require('util').inherits
const EventEmitter = require('events').EventEmitter

function TCPConnections (options) {
  if (!(this instanceof TCPConnections)) return new TCPConnections(options)
  this._server = createTCPServer(options)
  this._clients = {}
}

TCPConnections.prototype.connect = function connect (id, options) {
  const remoteAddress = options.host + ':' + options.port
  const client = net.connect({port: options.port, host: options.host}, () => {
    // 'connect' listener
    console.log(`Connected to ${remoteAddress}`)
    this._clients[id] = client
  })
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

TCPConnections.prototype.exit = function exit (id) {
  this._clients[id].end()
}

TCPConnections.prototype.send = function send (id, message, options) {
  const bufferFrameEncoder = new Bufsp()
  this._clients[id].write(bufferFrameEncoder.encode(message))
}

inherits(TCPConnections, EventEmitter)

function createTCPServer (options) {
  const server = net.createServer()
  server.on('connection', handleConnection)

  server.listen(options.port, () => {
    console.log('TCP server listening on', server.address())
  })

  return server

  function handleConnection (conn) {
    const remoteAddress = conn.remoteAddress + ':' + conn.remotePort
    console.log(`Client connected from ${remoteAddress}`)
    const bufferFrameDecoder = new Bufsp({returnString: true})

    bufferFrameDecoder.on('data', onConnData)
    conn.pipe(bufferFrameDecoder)
    conn.once('close', onConnClose)
    conn.on('error', onConnError)

    function onConnData (d) {
      console.log(d)
    }

    function onConnClose () {
      console.log(`Client connection ${remoteAddress} closed`)
    }

    function onConnError (err) {
      console.log(`Client connection ${remoteAddress} error: ${err.message}`)
    }
  }
}

module.exports = TCPConnections
