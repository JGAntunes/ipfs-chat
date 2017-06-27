const crypto = require('crypto')
const utp = require('utp')
const Bufsp = require('bufsp')
const inherits = require('util').inherits
const EventEmitter = require('events').EventEmitter

function Connections (options) {
  if (!(this instanceof Connections)) return new Connections(options)
  // This node's keys
  this._keys = options.keys
  this._keyStorage = options.storage
  this._conns = {}
  // Address -> publicKey index
  this._keyIndex = {}
  this._messageBuffer = {}
  this._createServer(options)
}

Connections.prototype.connect = function connect (options) {
  const remoteAddress = options.host + ':' + options.port
  const conn = utp.connect(options.port, options.host)
  console.log(`Connected to ${remoteAddress}`)
  this._conns[remoteAddress] = {
    socket: conn,
    publicKey: null,
    sessionEstablished: false,
    sharedSecret: false
  }
  // client.on('data', (data) => {
  //   console.log(data.toString())
  //   client.end()
  // })

  conn.send(remoteAddress, { status: 'INIT', publicKey: this._keys.public })

  conn.pipe(this._onData.bind(this, remoteAddress))

  conn.on('end', () => {
    console.log(`Disconnected from ${remoteAddress}`)
    delete this._conns[remoteAddress]
  })

  conn.on('error', (err) => {
    console.log(`Connection ${remoteAddress} error: ${err.message}`)
  })
}

Connections.prototype.exit = function exit (address) {
  this._conns[address].socket.end()
}

Connections.prototype.send = function send (address, message, options) {
  const conn = this._conns[address]
  if (!conn || !conn.sessionEstablished) {
    // TODO handle error here
  }
  this._send(conn.sharedSecret, address, message)
}

Connections.prototype._send = function internalSend (key, address, message) {
  const bufferFrameEncoder = new Bufsp()
  const encodedMessage = bufferFrameEncoder.encode(this._cipher(key, JSON.stringify(message)))
  this._conns[address].socket.write(encodedMessage)
}

Connections.prototype._createServer = function createServer (options) {
  this._server = utp.createServer()

  this._server.listen(options.server.port, () => {
    console.log('Connections server listening on', this._server.address())
  })

  this._server.on('connection', (conn) => {
    const remoteAddress = `${conn.address}':${conn.port}`
    console.log(`Client connected from ${remoteAddress}`)

    conn.once('close', () => {
      console.log(`Client connection ${remoteAddress} closed`)
    })

    conn.on('error', (err) => {
      console.log(`Client connection ${remoteAddress} error: ${err.message}`)
    })

    this._conns[remoteAddress] = {
      socket: conn,
      publicKey: null,
      sessionEstablished: false,
      sharedSecret: false
    }

    conn.pipe(this._onData.bind(this, remoteAddress))
  })
}

Connections.prototype._onData = function onData (remoteAddress, d) {
  const bufferFrameDecoder = new Bufsp({returnString: true})
  bufferFrameDecoder.on('data', () => {
    // Session already creted
    if (this._conns[remoteAddress].sessionEstablished) {
      return this._emit('data', this._decipher(this._conns[remoteAddress].sharedSecret, d))
    }

    // Handle handshake
    this._handleHandshake(remoteAddress, d)
  })
}

Connections.prototype._handleHandshake = function handleHandshake (address, data) {
  const handshake = this._decipher(this._keys.private, data)
  const publicKey = handshake.publicKey
  const conn = this._conns[address]

  // TODO validate data

  this._keyStorage.get(publicKey, (err, result) => {
    if (err) throw err

    if (address !== result) {
      // TODO handle this error
    }

    switch (handshake.status) {
      case 'INIT':
        conn.publicKey = publicKey
        this._generateSessionKey(address)
        const sessionKey = conn.ecdh.getPublicKey('base64')
        this._send(publicKey, address, {status: 'OK', sessionKey})
        return
      case 'ACK-1':
        conn.sharedSecret = conn.ecdh.computeSecret(handshake.sessionKey)
        this._send(publicKey, address, {status: 'ACK-2', sessionKey})
        break
      case 'ACK-2':
        conn.sharedSecret = conn.ecdh.computeSecret(handshake.sessionKey)
        conn.sessionEstablished = true
        this._send(publicKey, address, {status: 'DONE'})
        break
      case 'DONE':
        conn.sessionEstablished = true
        break
      case 'ERR':

        break
    }
  })
}

Connections.prototype._generateSessionKey = function generateSessionKey (address) {
  this._conns[address].ecdh = crypto.createECDH('secp521r1')
  this._conns[address].ecdh.generateKeys()
}

inherits(Connections, EventEmitter)

module.exports = Connections
