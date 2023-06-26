const cluster = require('cluster'),
        http = require('http'),
        {normalize, sep, join} = require("path"),
        zlib = require('zlib'),
        fs = require('fs'),
        crypto = require('crypto'),
        {prompt} = require("./lib/prompt"),
        {getIPAddress, isPortFree} = require('./lib/network'),
        {ifNotExist, isNotDirectory, ensurePathExists,} = require("./lib/dir"),
        {permissionsToFile, setTimeOnFile, verifyBytes,} = require("./lib/file"),
        {decryptValue, genKey} = require('./lib/crypt');

const pickOneRandomItem = (items) => {
    return items[Math.floor(Math.random() * items.length)]
};

// Set up the Process Signal Traps, so the application can exit gracefully.
const signalTraps = ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGABRT', 'SIGTERM', 'SIGUSR2'];
signalTraps.forEach(function (signal) {
    process.on(signal, function () {
        process.exit(0)
    });
});

const WorkersMap = new Map()

if (cluster.isMaster) {

    const launchWorker = (map, env) => {
        const newWorker = cluster.fork(env);
        map.set(newWorker.process.pid, [env, newWorker, 'FREE'])
        newWorker.on('message', onWorkerMessage(newWorker.process.pid));
        newWorker.on("exit", onWorkerExit(newWorker.process.pid, map));
    }
    const replaceWorker = (pid, map) => {
        const [env,] = map.get(pid)
        map.delete(pid)
        const newWorker = cluster.fork(env);
        map.set(newWorker.process.pid, [env, newWorker, 'FREE'])
        newWorker.on('message', onWorkerMessage(newWorker.process.pid));
        newWorker.on("exit", onWorkerExit(newWorker.process.pid, map));
    }
    const onWorkerMessage = (pid) => ({msg}) => {
        const [env, newWorker,] = WorkersMap.get(pid)
        WorkersMap.set(pid, [env, newWorker, msg])
    }
    const onWorkerExit = (pid, map) => (code, signal) => {
        console.log(`worker ${pid} died ${code} ${signal}`);
        replaceWorker(pid, map)
    }
    const getProgramParameters = async () => {
        // this allows us to pass in arguments for testing purposes
        const [, , ...args] = process.argv;
        if (args.length === 1 && args[0] === '--headless') {
            console.log('Running in headless mode')
            return {
                hostname: process.env.HOSTNAME,
                port: Number.parseInt(process.env.PORT.trim(), 10),
                passphrase: process.env.PASSPHRASE,
                salt: process.env.SALT,
                directory: process.env.DIRECTORY,
                encryptionAlgorithm: process.env.ENCRYPTIONALGORITHM,
            }
        }
        // normal interactive mode
        const {hostname} = await prompt([{
            type: 'input',
            name: 'hostname',
            message: 'Enter the external hostname or IP address',
            def: getIPAddress(),
            validate: async (str) => (str || '').trim().length !== 0 ? true : 'Try again, the hostname or IP address was not valid',
            filter: (str) => str.trim(),
        }])
        const {port} = await prompt([{
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
        },])
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
            }
        ])
        const encryptionAlgorithm = 'aes-256-cbc'
        return {hostname, port, passphrase, salt, directory, encryptionAlgorithm}
    }
    getProgramParameters()
        .then(({hostname, port, passphrase, salt, directory, encryptionAlgorithm}) => {
            const workDispatchServer = http.createServer((req, res) => {
                const freeServers = Array.from(WorkersMap.entries()).filter(([, [, , status]]) => status === 'FREE').map(([, [env, ,]]) => env.PORT).map((p) => `http://${hostname}:${p}/`)
                if (freeServers.length === 0) {
                    res.writeHead(503);
                    res.end(`busy`);
                    return
                }
                const Location = pickOneRandomItem(freeServers)
                console.log(`dispatching worker to ${Location}`);
                res.writeHead(302, {
                    Location
                });
                res.end();
            })
            workDispatchServer.on('error', (e) => {
                throw e
            });
            workDispatchServer.listen(port, () => {
                console.log(`Control server pid ${process.pid} started http://${hostname}:${port}/`);
                // for (let i = 1; i < totalCPUs; i++) {
                for (let i = 1; i <= 4; i++) {
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
        })
} else {
    const throwHttpError = (httpMessage, httpStatusCode = 500) => {
        const err = new Error(httpMessage)
        err.httpMessage = httpMessage
        err.httpStatusCode = httpStatusCode
        throw err
    }
    const worker = function worker(hostname, port, passphrase, salt, directory, encryptionAlgorithm) {
        console.log(`Starting worker`);
        const start = () => server.listen(port, () => console.log(`Worker listening http://${hostname}:${port}/`))
        const server = http.createServer((req, res) => {
            console.log('incoming request to a worker');
            try {
                process.send({msg: 'BUSY'})
                const headerValue = req.headers['meta'] || throwHttpError('Missing required "META" header', 400)
                const {
                    filePath, perms, bytes, iv, createdTime, modifiedTime
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
                process.send({msg: 'FREE'})
            }
        })
        server.on('error', (e) => {
            if (e.code === 'EADDRINUSE') {
                console.log(`Worker address ${port} in use, retrying...`);
                setTimeout(() => {
                    server.close();
                    start()
                }, 1000);
            }
            throw e
        });
        start()
    }
    worker(process.env.HOSTNAME, process.env.PORT, process.env.PASSPHRASE, process.env.SALT, process.env.DIRECTORY, process.env.ENCRYPTIONALGORITHM)
}
