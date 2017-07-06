const config = {
  ipc: {
    socket: process.env.P2P_CHAT_IPC_SOCKET || '/tmp/test.sock'
  }
}

module.exports = config
