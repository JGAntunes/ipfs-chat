const net = require('net')
const Bufsp = require('bufsp')
const uuidV4 = require('uuid/v4')
const fs = require('fs')
const inherits = require('util').inherits
const EventEmitter = require('events').EventEmitter

function IPCServer (options) {
  if (!(this instanceof IPCServer)) return new IPCServer(options)
  this._socketPath = options.socket
  this._conns = {}
  this._createServer(options)
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

  // Clean unix socket on exit
  process.on('exit', () => {
    fs.unlinkSync(this._socketPath)
  })
}

IPCServer.prototype.send = function send (message) {
  Object.keys(this._conns).forEach((id) => {
    const conn = this._conns[id]
    const bufferFrameEncoder = new Bufsp()
    console.log('Sending data to conn')
    conn.write(bufferFrameEncoder.encode(message))
  })
}

IPCServer.prototype.setState = function setState (state) {
  Object.keys(this._conns).forEach((id) => {
    const conn = this._conns[id]
    const bufferFrameEncoder = new Bufsp()
    conn.write(bufferFrameEncoder.encode(JSON.stringify(state)))
  })
}

IPCServer.prototype._createServer = function createServer (options) {
  const self = this
  this._server = net.createServer()
  this._server.on('connection', handleConnection)

  function handleConnection (conn) {
    const remoteAddress = conn.remoteAddress + ':' + conn.remotePort
    console.log(`Client connected from ${remoteAddress}`)
    const bufferFrameDecoder = new Bufsp({returnString: true})
    const id = uuidV4()
    self._conns[id] = conn
    bufferFrameDecoder.on('data', onConnData)
    conn.pipe(bufferFrameDecoder)
    conn.once('close', onConnClose)
    conn.on('error', onConnError)

    function onConnData (data) {
      console.log(data)
      try {
        const op = JSON.parse(data)
        self.emit(op.method, op)
      } catch (err) {
        console.log(`Invalid operation sent ${remoteAddress} error: ${err.message}`)
      }
    }

    function onConnClose () {
      delete self._conns[id]
      console.log(`Client connection ${remoteAddress} closed`)
    }

    function onConnError (err) {
      console.log(`Client connection ${remoteAddress} error: ${err.message}`)
    }
  }
}

inherits(IPCServer, EventEmitter)

module.exports = IPCServer
