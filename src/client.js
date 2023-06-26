const zlib = require('zlib'),
        fs = require('fs'),
        crypto = require('crypto'),
        {encryptValue, genKey} = require('./lib/crypt'),
        {prompt} = require('./lib/prompt'),
        {buildStat, walkDirGen, isNotDirectory, ifNotExist} = require("./lib/dir"),
        {globToRegex} = require("./lib/glob"),
        http = require('http'),
        {join, normalize, sep} = require("path");

// Set up the Process Signal Traps, so the application can exit gracefully.
const signalTraps = ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGABRT', 'SIGTERM', 'SIGUSR2'];
signalTraps.forEach(function (signal) {
    process.on(signal, function () {
        process.exit(0)
    });
});

const getProgramParameters = async () => {
    // --headless allows passing parameters via environment
    //   variables. This should only be done for testing,
    //   environment variables are not secure, as a process
    //   explorer ( via the super used ) can see them
    const [, , ...args] = process.argv;
    if (args.length === 1 && args[0] === '--headless') {
        console.log('Running in headless mode')
        return {
            serverUrl: process.env.SERVERURL,
            passphrase: process.env.PASSPHRASE,
            salt: process.env.SALT,
            directory: process.env.DIRECTORY,
            globPatterns: [new RegExp(globToRegex('**'))],
            dryRun: false,
            MaxWorkers: 4,
            encryptionAlgorithm: process.env.ENCRYPTIONALGORITHM,
        }
    }
    // Start normal interactive mode
    const {serverUrl, passphrase, salt, directory, includeGlob, dryRun} = await prompt([
        {
            type: 'input',
            name: 'serverUrl',
            message: 'Enter the server URL',
            validate: async (str) => {
                const urlRegex = /^(http:\/\/)?([a-zA-Z0-9.-]+)(:[0-9]+)?\/$/;
                return urlRegex.test(str) ? true : 'Try again, the URL was not valid'
            },
        },
        {
            type: 'password',
            name: 'passphrase',
            message: 'Enter a Passphrase',
            validate: async (str) => {
                return (Buffer.byteLength(str, 'utf8') > 32) ? true : `Try again, the passphrase was only ${Buffer.byteLength(str, 'utf8')} bytes and needs to be 32 Bytes`
            },
        },
        {
            type: 'password',
            name: 'salt',
            message: 'Enter a Salt',
            validate: async (str) => {
                return (Buffer.byteLength(str, 'utf8') > 16) ? true : `Try again, the salt was only ${Buffer.byteLength(str, 'utf8')} bytes and needs to be 16 Bytes`
            },
        },
        {
            type: 'confirm',
            name: 'dryRun',
            message: 'Execute a dry run only',
            def: true,
        },
        {
            type: 'input',
            name: 'directory',
            message: 'Enter a directory',
            validate: async (str) => {
                if (ifNotExist(str)) {
                    return 'Try again, the Directory does not exist.'
                }
                if (isNotDirectory(str)) {
                    return `Try again, ${str} does not appear to be a Directory.`
                }
                return true
            },
            filter: (str) => {
                if (normalize(str).endsWith(sep)) {
                    return str
                }
                return normalize(join(str, sep))
            },
        },
        {
            type: 'confirm',
            name: 'includeGlob',
            message: 'Include Globs',
            def: false,
        },
    ])
    // Collect Apache Glob Patterns
    const globPatterns = [];
    if (includeGlob) {
        const answer = await prompt([
            {
                type: 'editor',
                name: 'globPatterns',
                message: 'You are about to enter your OS default editor. Enter a glob pattern, one per line, save the file, and exit to continue. Hit enter to start.',
                validate: async (str) => {
                    return (str.length > 0) ? true : `Try again, the glob pattern was empty`
                },
                filter: (str) => {
                    return str.split('\n').filter(Boolean).map(globPattern => globPattern.trim())
                },
            }
        ])
        globPatterns.push(...answer.globPatterns.map(globToRegex).map(globPattern => new RegExp(globPattern)))
    } else {
        globPatterns.push(new RegExp(globToRegex('**')))
    }
    const MaxWorkers = 4
    const encryptionAlgorithm = 'aes-256-cbc'
    return {
        serverUrl,
        passphrase,
        salt,
        directory,
        globPatterns,
        dryRun,
        MaxWorkers,
        encryptionAlgorithm
    }
}
getProgramParameters()
        .then(async ({
                         serverUrl,
                         passphrase,
                         salt,
                         directory,
                         globPatterns,
                         dryRun,
                         MaxWorkers,
                         encryptionAlgorithm
                     }) => {
            console.log(`Starting client connecting to ${serverUrl}`);
            /**
             * the Key is what comes from the Server starting up...
             * @type {string}
             */
            const encryptionKey = genKey(passphrase, salt)
            const iv = crypto.randomBytes(16)
            const isMatch = (filePath) => globPatterns.some(globPattern => globPattern.test(filePath))
            const promises = []
            for await (let {filePath, perms} of walkDirGen(directory, '.')) {
                if (!isMatch(filePath)) {
                    console.log(`Skipping ${filePath}, did not match any GLOBs`)
                    continue
                }
                if (dryRun) {
                    console.log(filePath);
                    continue
                }
                if (!perms.o.r || !perms.g.r || !perms.u.r) {
                    console.log(`Skipping ${filePath}, insufficient permissions to read the file`)
                    continue
                }
                promises.push(new Promise(async (resolve, reject) => {
                    console.log(`Sending ${filePath}`)
                    /**
                     * this is a little complicated:
                     *   the Meta Header does not have an IV, which is absolutely required if the data inside repeats.
                     *   SO, I slap in a NONCE. Yes a nonce should be the first thing, and this is JSON... but
                     *   it will do for now.
                     *
                     *   I do generate an IV ( as an attribute in the JSON payload ) as part of the Meta Header,
                     *   this IV is used to encrypt the following data in the stream. which is good, because in theory
                     *   we could transmit a file that has a bunch of repeating stuff in it and could be cracked.
                     */
                    const nonce = {
                        [crypto.randomBytes(16).toString('hex')]: crypto.randomBytes(16).toString('hex')
                    }
                    const meta = encryptValue(JSON.stringify({
                        ...nonce,
                        ...buildStat(directory, filePath),
                        iv: iv.toString('hex')
                    }), passphrase, salt)

                    const getNextWorker = async function ({hostname, port, pathname}) {
                        if (!getNextWorker.timeout) {
                            getNextWorker.timeout = 500; // Initial timeout value
                        } else {
                            getNextWorker.timeout *= 1.66; // Exponentially increase the timeout value
                        }
                        return new Promise((resolve, reject) => {
                            const req = http.request({
                                hostname,
                                port,
                                path: pathname,
                                method: 'GET'
                            }, (res) => {
                                if (res.statusCode === 302 && res.headers.location) {
                                    delete getNextWorker.timeout // Reset timeout value if successful
                                    resolve(res.headers.location);
                                } else if (res.statusCode === 503) {
                                    setTimeout(() => {
                                        resolve(getNextWorker({hostname, port, pathname}));
                                    }, getNextWorker.timeout);
                                } else {
                                    reject(new Error(`Unable to get worker, status code ${res.statusCode}`))
                                }
                            })
                            req.on('error', (e) => {
                                console.error(`problem with request: ${e.message}`);
                                reject(new Error(`Unable to get worker, error message ${e.message}`))
                            });
                            req.end();
                        })
                    }
                    const url = await getNextWorker(new URL(serverUrl))
                    const options = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/octet-stream',
                            meta
                        }
                    }
                    const callBack = (res) => {
                        let statusCode = res.statusCode;
                        let body = '';
                        res.on('data', (chunk) => {
                            body += chunk;
                        });
                        res.on('end', () => {
                            resolve({body, statusCode})
                        });
                    }
                    const req = http.request(url, options, callBack);
                    req.on('error', reject);
                    fs.createReadStream(normalize(join(directory, filePath)))
                            .pipe(crypto.createCipheriv(encryptionAlgorithm, encryptionKey, iv, {}))
                            .pipe(zlib.createGzip())
                            .pipe(req)
                }))
                if (promises.length >= MaxWorkers) {
                    await Promise.all(promises)
                    promises.length = 0
                }
            }
        })
        .catch(error => {
            console.error('Error:', error)
            process.exit(1)
        })
