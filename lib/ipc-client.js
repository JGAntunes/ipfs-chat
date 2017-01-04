const net = require('net')
const Bufsp = require('bufsp')
const inherits = require('util').inherits
const EventEmitter = require('events').EventEmitter

function IPCClient (options) {
  if (!(this instanceof IPCClient)) return new IPCClient(options)
  this._socketPath = options.socket
  this._socket = new net.Socket()
  this._state = {}
}

IPCClient.prototype.start = function start (done) {
  const bufferFrameDecoder = new Bufsp({returnString: true})
  bufferFrameDecoder.on('data', onConnData)
  this._socket.pipe(bufferFrameDecoder)
  this._socket.once('close', onConnClose)
  this._socket.on('error', onConnError)

  const onConnData = (data) => {
    try {
      const op = JSON.parse(data)
      this.emit(op.method, data)
    } catch (err) {
      console.log(`Invalid operation received error: ${err.message}`)
    }
  }

  const onConnClose = () => {
    console.log(`IPC client connection closed`)
  }

  const onConnError = (err) => {
    console.log(`IPC client connection error: ${err.message}`)
  }

  this._server.connect(this._socketPath, () => {
    console.log('IPC client connected on', this._socketPath)
    done()
  })
}

IPCClient.prototype.send = function send (message, callback) {
  const bufferFrameEncoder = new Bufsp()
  this._socket.write(bufferFrameEncoder.encode(JSON.stringify(message)), callback)
}

inherits(IPCClient, EventEmitter)

module.exports = IPCClient
