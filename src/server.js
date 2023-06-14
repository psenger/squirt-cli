const zlib = require('zlib'),
        fs = require('fs'),
        http = require('http'),
        crypto = require('crypto'),
        {join, normalize, sep} = require('path'),
        {decryptValue, genKey} = require('./lib/crypt'),
        {prompt} = require('./lib/prompt'),
        {
            ensurePathExists,
            permissionsToFile,
            setTimeOnFile,
            verifyBytes,
            ifNotExist,
            isNotDirectory
        } = require('./lib/dir'),
        {getIPAddress, isPortFree} = require('./lib/network');

const run = async () => {
    const signalTraps = ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGABRT', 'SIGTERM', 'SIGUSR2'];
    signalTraps.forEach(function (signal) {
        process.on(signal, function () {
            process.exit(0)
        });
    });
    try {
        const {hostname} = await prompt([
            {
                type: 'input',
                name: 'hostname',
                message: 'Enter the external hostname or IP address',
                def: getIPAddress(),
                validate: async (str) => (str || '').trim().length !== 0 ? true : 'Try again, the hostname or IP address was not valid',
                filter: (str) => str.trim(),
            }
        ])
        const {port} = await prompt([
            {
                type: 'input',
                name: 'port',
                message: 'Enter the http Port',
                def: 3000,
                validate: async (str) => {
                    if ((str || '').toString().trim().length === 0) {
                        return 'Blank, invalid port value'
                    }
                    if (!str.toString().trim().match(/^\d+$/)) {
                        return 'Blank, invalid port value'
                    }
                    if (await isPortFree(Number.parseInt(str.toString().trim(), 10), hostname) === false) {
                        return `Port ${str.toString().trim()} is not available on ${hostname}, try again`
                    }
                    return true
                },
                filter: (str) => Number.parseInt(str.toString().trim(), 10),
            },
        ])
        const {passphrase, salt, directory} = await prompt([
            {
                type: 'password',
                name: 'hostname',
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
        ])

        const encryptionAlgorithm = 'aes-256-cbc'
        const throwHttpError = (httpMessage, httpStatusCode = 500) => {
            const err = new Error(httpMessage)
            err.httpMessage = httpMessage
            err.httpStatusCode = httpStatusCode
            throw err
        }
        const server = http.createServer((req, res) => {
            try {
                const headerValue = req.headers['meta'] || throwHttpError('Missing required "META" header', 400)
                const {
                    filePath,
                    perms,
                    bytes,
                    iv,
                    createdTime,
                    modifiedTime
                } = JSON.parse(decryptValue(headerValue, passphrase, salt))
                ensurePathExists(join(directory, filePath))
                const compressedEncryptedStream = req
                        .pipe(zlib.createGunzip())
                        .pipe(crypto.createDecipheriv(encryptionAlgorithm, genKey(passphrase, salt), Buffer.from(iv, 'hex'), {}))
                        .pipe(fs.createWriteStream(join(directory, filePath)))
                compressedEncryptedStream.on('finish', () => {
                    permissionsToFile(perms, join(directory, filePath))
                    setTimeOnFile(createdTime, modifiedTime, join(directory, filePath))
                    console.log(`Received ${filePath} ${verifyBytes(bytes, join(directory, filePath))}`)
                    // set the file permissions and ownership
                    res.writeHead(200)
                    res.end(JSON.stringify({message: 'done'}))
                })
            } catch (err) {
                console.log(err)
                res.setHeader('Content-Type', 'application/json')
                res.writeHead(err.httpStatusCode || 500)
                res.end(JSON.stringify({error: err.httpMessage || err.message || 'Error'}))
            }
        })
        server.listen(port, () => {
            console.log(`Server listening on port http://${hostname}:${port}/`)
        })
    } catch (err) {
        console.log(err)
        process.exit(1)
    }
}

run()
        .then(() => {
            console.log('Done')
            process.exit(0)
        })
        .catch(error => {
            console.error('Error:', error)
            process.exit(1)
        })
