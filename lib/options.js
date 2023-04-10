
try {
    require('commander')
} catch (error) {
    console.error('Error: Please run `npm install` first')
    process.exit(1)
}
module.exports = (()=> {
    const {name, version} = require('../package.json')
    const program = require('commander').program

    const Options = {}

    program.showHelpAfterError()

    program.name(name)
            .description('P2P encrypted file transfer')
            .version(version)
            .option('-p, --port <number>', 'The transfer port', 8080)

    program.command('client')
            .description('Act as a client to send files')
            .argument('<directory>', 'The directory to the files to send')
            .action((directory) => {
                Options.command = 'client'
                Options.directory = directory
            });
    program.command('server')
            .description('Act as a server to receive files')
            .argument('<directory>', 'The directory with which to save the files')
            .action((directory) => {
                Options.command = 'server'
                Options.directory = directory
            });

    program.parse()

    Options.port = program.opts().port

    return Options
})()


