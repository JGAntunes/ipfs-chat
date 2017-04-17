const config = require('../config')
const levelup = require('level')

const db = levelup(config.storage.location)

module.exports = db
