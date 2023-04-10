#!/usr/bin/env node

const options = require('./lib/options')

if ( options.command === 'client' ) {
    require('./lib/client')(options)
} else if ( options.command === 'server' ) {
    require('./lib/server')(options)
}
