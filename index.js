#!/usr/bin/env node

const options = require("./lib/options");
const run = async () => {
    const options = require('./lib/options')
    if ( options.command === 'client' ) {
        return require('./lib/client')(options)
    } else if ( options.command === 'server' ) {
        return require('./lib/server')(options)
    }
}
run().then(console.log).catch(console.error)
