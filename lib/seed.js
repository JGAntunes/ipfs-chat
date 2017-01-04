const kad = require('kad')

const dht = new kad.Node({
  transport: kad.transports.UDP(kad.contacts.AddressPortContact({
    address: '127.0.0.1',
    port: 1338
  })),
  storage: kad.storage.FS('./tmp')
})

// dht.connect(seed, (err)  => {
//   // dht.get(key, callback);
//   // dht.put(key, value, callback);
// })