const net = require('net')
const Bufsp = require('bufsp')
const uuidV4 = require('uuid/v4')
const inherits = require('util').inherits
const EventEmitter = require('events').EventEmitter

function IPCServer (options) {
  if (!(this instanceof IPCServer)) return new IPCServer(options)
  this._socketPath = options.socket
  this._server = createServer(options)
  this._conns = {}
  /* Server state spec
  * {
  *   room: null || uuidv4
  * }
  */
  this._state = {}
}

IPCServer.operations = {
  join: 'JOIN',
  exit: 'EXIT',
  message: 'MESSAGE',
  create: 'CREATE'
}

IPCServer.prototype.start = function start (done) {
  this._server.listen(this._socketPath, () => {
    console.log('IPC server listening on', this._server.address())
    done()
  })
}

IPCServer.prototype.setState = function setState (state, done) {
  Object.keys(this._clients).forEach((client) => {
    const bufferFrameEncoder = new Bufsp()
    client.write(bufferFrameEncoder.encode(JSON.stringify(state)))
  })
  done()
}

inherits(IPCServer, EventEmitter)

function createServer (options) {
  const server = net.createServer()
  server.on('connection', handleConnection)

  return server

  function handleConnection (conn) {
    const remoteAddress = conn.remoteAddress + ':' + conn.remotePort
    console.log(`Client connected from ${remoteAddress}`)
    const bufferFrameDecoder = new Bufsp({returnString: true})
    const id = uuidV4()
    this._conns.push(id)
    bufferFrameDecoder.on('data', onConnData)
    conn.pipe(bufferFrameDecoder)
    conn.once('close', onConnClose)
    conn.on('error', onConnError)

    function onConnData (data) {
      try {
        const op = JSON.parse(data)
        server.emit(op.method, data)
      } catch (err) {
        console.log(`Invalid operation sent ${remoteAddress} error: ${err.message}`)
      }
    }

    function onConnClose () {
      delete this._conns[id]
      console.log(`Client connection ${remoteAddress} closed`)
    }

    function onConnError (err) {
      console.log(`Client connection ${remoteAddress} error: ${err.message}`)
    }
  }
}

module.exports = IPCServer
