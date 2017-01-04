const uuidV4 = require('uuid/v4')
const config = require('../config')
const commandCli = require('vorpal')()

dht.connect(config.seed, (err) => {
  if (err) throw err

  commandCli
    .command('\\new', 'Creates a new chat room')
    .action(function (args, callback) {
      const key = uuidV4()
      dht.put(key, JSON.stringify(config.chat), (err) => {
        if (err) throw err
        this.log(`Created a new chat session ${key}`)
        callback()
      })
    })

  commandCli
    .command('\\join <room>', 'Join a chat room')
    .action(function (args, callback) {
      const key = args.room
      dht.get(key, (err, result) => {
        if (err) throw err
        chat.connect(key, JSON.parse(result))
        this.log(`Got a chat session ${result}`)
        chatCli
          .catch('[words...]', 'Chat stuff')
          .action(function (args, cb) {
            chat.send(key, args.words.join(' '))
            cb()
          })
        chatCli
          .delimiter(`chat-room: ${key}`)
          .show()
        callback()
      })
    })

  commandCli
    .delimiter('kad-chat$')
    .show()
})