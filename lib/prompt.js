const readline = require("readline"),
        {isNotDirectory,ifNotExist} = require('./dir');
module.exports.forSalt = async () => new Promise((resolve, reject) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter a Salt: ', (rawAnswer) => {
        const answer = rawAnswer.trim()
        if ( Buffer.byteLength(answer, 'utf8') <= 16 ) {
            console.log( 'Try again, the Salt is not long enough')
            console.log( `You entered: "${answer}", ${Buffer.byteLength(answer, 'utf8')} bytes`);
            rl.close();
            return module.exports.forSalt()
        }
        rl.close();
        resolve(answer)
    });
})
module.exports.forPassphrase = async () => new Promise((resolve, reject) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter a Passphrase: ', (rawAnswer) => {
        const answer = rawAnswer.trim()
        if ( Buffer.byteLength(answer, 'utf8') <= 32 ) {
            console.log( 'Try again, the Passphrase is not long enough')
            console.log( `You entered: "${answer}", ${Buffer.byteLength(answer, 'utf8')} bytes`);
            rl.close();
            return module.exports.forPassphrase()
        }
        rl.close();
        resolve(answer)
    });
})
module.exports.forDir = async () => new Promise((resolve, reject) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter a Directory: ', (rawAnswer) => {
        const answer = rawAnswer.trim()
        if ( answer.length === 0 ) {
            console.log( 'Try again.')
            rl.close();
            return module.exports.forDir()
        }
        if ( ifNotExist (answer) ) {
            console.log( 'Try again, the Directory does not exist.')
            rl.close();
            return module.exports.forDir()
        }
        if ( isNotDirectory (answer) ) {
            console.log( `Try again, ${answer} does not appear to be a Directory.`)
            rl.close();
            return module.exports.forDir()
        }
        resolve(answer)
    });
})
module.exports.confirmOrChangePrompt = async (question, defaultOption) => new Promise((resolve, reject) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question(`${question} (${defaultOption}): `, (answer) => {
        const sanitizedAnswer = answer.trim().toLowerCase();
        if (sanitizedAnswer === '' || sanitizedAnswer === defaultOption.toLowerCase()) {
            resolve(defaultOption);
        } else {
            resolve(answer);
        }
        rl.close();
    });
})


