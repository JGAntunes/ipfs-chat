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
}

IPCServer.prototype.start = function start (done) {
  this._server.listen(this._socketPath, () => {
    console.log('IPC server listening on', this._server.address())
    // Clean unix socket on exit
    process.on('exit', () => {
      fs.unlinkSync(this._socketPath)
    })
    done()
  })
}

IPCServer.prototype.send = function setState (msg) {
  Object.keys(this._conns).forEach((id) => {
    const conn = this._conns[id]
    const bufferFrameEncoder = new Bufsp()
    conn.write(bufferFrameEncoder.encode(JSON.stringify(msg)))
  })
}

IPCServer.prototype._createServer = function createServer (options) {
  const handleConnection = (conn) => {
    console.log(`Client connected`)
    const bufferFrameDecoder = new Bufsp({returnString: true})
    const id = uuidV4()

    const onConnData = (data) => {
      console.log(data)
      try {
        const op = JSON.parse(data)
        this.emit(op.method, op)
      } catch (err) {
        console.log(`Invalid operation sent, error: ${err.message}`)
      }
    }

    const onConnClose = () => {
      delete this._conns[id]
      console.log(`Client connection closed`)
    }

    const onConnError = (err) => {
      console.log(`Client connection error: ${err.message}`)
    }

    this._conns[id] = conn
    bufferFrameDecoder.on('data', onConnData)
    conn.pipe(bufferFrameDecoder)
    conn.once('close', onConnClose)
    conn.on('error', onConnError)
  }

  this._server = net.createServer()
  this._server.on('connection', handleConnection)
}

inherits(IPCServer, EventEmitter)

module.exports = IPCServer
