const config = {
  dht: {
    address: process.env.KAD_CHAT_DHT_ADDRESS || 'localhost',
    port: parseInt(process.env.KAD_CHAT_DHT_PORT) || 3333
  },
  connections: {
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
    location: process.env.KAD_CHAT_STORAGE_LOCATION || './.tmp/kad_chat_dht'
  }
}

module.exports = config
