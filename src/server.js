const cluster = require('cluster'),
        http = require('http'),
        {normalize, sep, join} = require("path"),
        zlib = require('zlib'),
        fs = require('fs'),
        crypto = require('crypto'),
        totalCPUs = require('os').cpus().length,
        {prompt} = require("./lib/prompt"),
        {getIPAddress, isPortFree} = require('./lib/network'),
        {
            ifNotExist,
            isNotDirectory,
            ensurePathExists,
            permissionsToFile,
            setTimeOnFile,
            verifyBytes,
        } = require("./lib/dir"),
        {decryptValue, genKey} = require('./lib/crypt');

const pickOneRandomItem = (items) => {
    return items[Math.floor(Math.random() * items.length)]
};

const signalTraps = ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGABRT', 'SIGTERM', 'SIGUSR2'];
signalTraps.forEach(function (signal) {
    process.on(signal, function () {
        process.exit(0)
    });
});

const WorkersMap = new Map()

const server = async function server (hostname,port, passphrase, salt, directory,encryptionAlgorithm) {
    try {
        const throwHttpError = (httpMessage, httpStatusCode = 500) => {
            const err = new Error(httpMessage)
            err.httpMessage = httpMessage
            err.httpStatusCode = httpStatusCode
            throw err
        }
        const server = http.createServer((req, res) => {
            try {
                process.send({msg:'BUSY'})
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
            } finally {
                process.send({msg:'FREE'})
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

if (cluster.isMaster) {

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

    const launchWorker = (map, env) => {
        const newWorker = cluster.fork(env);
        map.set(newWorker.process.pid, [env, newWorker, 'FREE'])
        newWorker.on('message', onWorkerMessage(newWorker.process.pid));
        newWorker.on("exit", onWorkerExit(map));
    }
    const replaceWorker = (map, diedWorker) => {
        const [env,] = map.get(diedWorker.process.pid)
        map.delete(diedWorker.process.pid)
        const newWorker = cluster.fork(env);
        map.set(newWorker.process.pid, [env, newWorker, 'FREE'])
        newWorker.on('message', onWorkerMessage(newWorker.process.pid));
        newWorker.on("exit", onWorkerExit(map));
    }
    const onWorkerMessage = (pid) => ({msg}) => {
        const [env, newWorker,] = WorkersMap.get(pid)
        WorkersMap.set(pid, [env, newWorker, msg])
    }
    const onWorkerExit = (map) => (diedWorker, code, signal) => {
        console.log(`worker ${diedWorker.process.pid} died ${code} ${signal}`);
        replaceWorker(map, diedWorker)
    }

    const workDispatchServer = http.createServer((req, res) => {
        const freeServers = Array.from(WorkersMap.entries()).filter(([pid, [env, work, status]]) => status === 'FREE').map(([pid, [env, work, status]]) => env.PORT).map((p) => `http://${hostname}:${p}/`)
        if (freeServers.length === 0) {
            res.writeHead(503);
            res.end(`busy`);
            return
        }
        res.writeHead(302, {
            Location: pickOneRandomItem(freeServers)
        });
    })
    workDispatchServer.listen(port, () => {
        console.log(`Control server pid ${process.pid} started http://${hostname}:${port}/`);
        // for (let i = 1; i < totalCPUs; i++) {
        for (let i = 1; i < 4; i++) {
            const env = {
                HOSTNAME: hostname,
                PORT: port + i,
                PASSPHRASE: passphrase,
                SALT: salt,
                DIRECTORY: directory,
                ENCRYPTIONALGORITHM: encryptionAlgorithm
            }
            launchWorker(WorkersMap, env)
        }
    })

} else {
    server(process.env.HOSTNAME, process.env.PORT, process.env.PASSPHRASE, process.env.SALT, process.env.DIRECTORY, process.env.ENCRYPTIONALGORITHM)
            .then(() => {
                console.log('Done')
                process.exit(0)
            })
            .catch(error => {
                console.error('Error:', error)
                process.exit(1)
            })
}
