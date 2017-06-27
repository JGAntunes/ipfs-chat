const levelup = require('level')

const db = (options) => levelup(options)

module.exports = db
