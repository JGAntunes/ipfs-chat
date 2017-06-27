const IPCClient = require('./ipc-client')
const IPCServer = require('./ipc-server')
const vorpal = require('vorpal')

function Client (options) {
  if (!(this instanceof Client)) return new Client(options)
  this._ipcClient = new IPCClient(options)
  this._cli = vorpal()
}

Client.prototype.start = function start (done) {
  this._ipcClient.on(IPCServer.operations.message, (message) => {
    this._cli.log(message.params.message)
  })

  this._ipcClient.start((err) => {
    if (err) throw err

    this._startCli()
  })
}

Client.prototype._startCli = function startCli () {
  const self = this
  this._cli
    // .command('\\new', 'Creates a new chat room')
    // .action(function (args, callback) {
    //   self._ipcClient.send({
    //     method: IPCServer.operations.create,
    //     // id: uuidV4()
    //   }, callback)
    // })

  this._cli
    .command('\\join <key>', 'Join a chat with someone')
    .action(function (args, callback) {
      const key = args.key
      self._ipcClient.send({
        method: IPCServer.operations.join,
        params: {
          key
        },
        // id: uuidV4()
      }, (err) => {
        if (err) throw err
        self._cli
          .catch('[words...]', 'Chat stuff')
          .action(function (args, cb) {
            self._ipcClient.send({
              method: IPCServer.operations.message,
              params: {
                key,
                message: args.words.join(' ')
              },
              // id: uuidV4()
            }, cb)
          })

        self._cli
          .delimiter(`chat-key: ${key}`)
          .show()
        callback()
      })
    })

  this._cli
    .delimiter('kad-chat$')
    .show()
}

module.exports = Client
