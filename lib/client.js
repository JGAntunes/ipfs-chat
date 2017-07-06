const IPCClient = require('./ipc-client')
const vorpal = require('vorpal')

function Client (options) {
  if (!(this instanceof Client)) return new Client(options)
  this._ipcClient = new IPCClient(options)
  this._cli = vorpal()
}

Client.prototype.start = function start (done) {
  this._ipcClient.on('message', (data) => {
    this._cli.log(`${data.from}:> ${data.message}`)
  })

  this._ipcClient.start((err) => {
    if (err) throw err

    this._startCli()
  })
}

Client.prototype._startCli = function startCli () {
  const self = this
  let currentRoom = null

  this._cli
    .mode('\\join <room>', 'Join a chat room')
    .init(function (args, callback) {
      this.delimiter(`room>${args.room}`)
      self._ipcClient.send({
        method: 'join',
        params: {
          room: args.room
        }
        // id: uuidV4()
      }, (err) => {
        if (err) throw err
        currentRoom = args.room
        callback()
      })
    })
    .action(function (command, callback) {
      self._ipcClient.send({
        method: 'message',
        params: {
          room: currentRoom
        },
        payload: command
        // id: uuidV4()
      }, callback)
    })

  this._cli
    .delimiter('p2p-chat$')
    .show()
}

module.exports = Client
