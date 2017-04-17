const fs = require('fs')

const config = {
  dht: {
    address: process.env.KAD_CHAT_DHT_ADDRESS || 'localhost',
    port: parseInt(process.env.KAD_CHAT_DHT_PORT) || 3333
  },
  chat: {
    address: process.env.KAD_CHAT_CHAT_ADDRESS || 'localhost',
    port: parseInt(process.env.KAD_CHAT_CHAT_PORT) || 4004
  },
  seed: {
    address: process.env.KAD_CHAT_SEED_ADDRESS || 'localhost',
    port: parseInt(process.env.KAD_CHAT_SEED_PORT) || 1338
  },
  ipc: {
    socket: process.env.KAD_CHAT_IPC_SOCKET || '/tmp/test.sock'
  },
  storage: {
    location: process.env.KAD_CHAT_STORAGE_LOCATION || './tmp/kad_chat_dht'
  },
  keys: {
    private: fs.readFileSync(process.env.KAD_CHAT_PRIVATE_KEY || './keys/private.pem', {encoding: 'utf-8'}),
    public: fs.readFileSync(process.env.KAD_CHAT_PUBLIC_KEY || './keys/public.pem', {encoding: 'utf-8'})
  }
}

module.exports = config
