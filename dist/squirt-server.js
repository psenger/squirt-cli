#!/usr/bin/env node

'use strict';

var require$$0$3 = require('cluster');
var require$$1$2 = require('http');
var require$$0$1 = require('path');
var require$$3$1 = require('zlib');
var require$$2 = require('fs');
var require$$0$2 = require('crypto');
var require$$0 = require('readline');
var require$$1 = require('child_process');
var require$$3 = require('os');
var require$$4 = require('stream');
var require$$1$1 = require('net');

var server = {};

var prompt$1 = {};

const readline = require$$0,
        {spawnSync} = require$$1,
        fs$1 = require$$2,
        os$1 = require$$3,
        {Transform} = require$$4;

/**
 * @typedef {Object} User
 * @property {boolean} r - read
 * @property {boolean} w - write
 * @property {boolean} x - execute
 */
/**
 * @typedef {Object} Group
 * @property {boolean} r - read
 * @property {boolean} w - write
 * @property {boolean} x - execute
 */
/**
 * @typedef {Object} Other
 * @property {boolean} r - read
 * @property {boolean} w - write
 * @property {boolean} x - execute
 */
/**
 * @typedef {Object} Question
 * @property {User} u - The user permissions
 * @property {Group} g - The group permissions
 * @property {Other} o - The other permissions
 */

/**
 * Prompt the user for input
 * @param questions
 * @returns {Promise<{}>}
 */
prompt$1.prompt = async (questions) => {
    const answers = {};

    function askQuestion(question) {
        return new Promise(async (resolve) => {
            const {type, name, message, validate, filter, def} = question;

            async function validateAnswer(answer) {
                if (validate) {
                    const resolvedValue = await validate(answer);
                    if (resolvedValue !== true) {
                        console.log(resolvedValue);
                        return false;
                    }
                }
                return true;
            }

            function applyFilter(answer) {
                return filter ? filter(answer) : answer;
            }

            function questionLoop() {
                if (type === 'editor') {
                    new Promise((resolve) => {
                        const rl = readline.createInterface({
                            input: process.stdin,
                            output: process.stdout,
                        });
                        rl.question(`${message}`, () => {
                            rl.close();
                            resolve();
                        });
                    }).then(async () => {
                        const tempFilePath = fs$1.mkdtempSync(`${os$1.tmpdir()}/`);
                        const tempFileFullPath = `${tempFilePath}/${name}.tmp`;
                        const editorCommand = process.env.EDITOR || 'vi'; // Use system default editor or vi if not defined
                        spawnSync(editorCommand, [tempFileFullPath], {stdio: 'inherit'});
                        const answer = fs$1.readFileSync(tempFileFullPath, 'utf8');
                        const isValid = await validateAnswer(answer);
                        if (isValid) {
                            answers[name] = applyFilter(answer);
                            resolve();
                            fs$1.unlinkSync(tempFileFullPath);
                        } else {
                            questionLoop();
                        }
                    });
                } else if (type === 'input') {
                    const rl = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout,
                    });
                    const defaultValue = `${def ? ` (${def}) ` : ' '}`;
                    rl.question(`${message}${defaultValue}:`, async (answer) => {
                        if (answer.trim().length === 0 && def) {
                            answer = def;
                        }
                        const isValid = await validateAnswer(answer);
                        if (isValid) {
                            answers[name] = applyFilter(answer);
                            rl.close();
                            resolve();
                        } else {
                            rl.close();
                            questionLoop();
                        }
                    });
                } else if (type === 'confirm') {
                    const rl = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout,
                    });
                    const defaultString = `${def ? '(y)' : 'y'}/${!def ? '(n)' : 'n'}`;
                    rl.question(`${message} ${defaultString}: `, (rawAnswer) => {
                        answers[name] = !!(rawAnswer || `${def ? 'y' : 'n'}`).match(/^y(es)?$/i);
                        rl.close();
                        resolve();
                    });
                } else if (type === 'password') {
                    const stdin = process.stdin;
                    const stdout = process.stdout;
                    stdin.setRawMode(true);
                    stdin.resume();
                    stdout.write(`${message}: `);
                    let password = '';
                    // noinspection JSUnusedGlobalSymbols
                    stdin.pipe(new Transform({
                        encoding: 'utf8',
                        transform(chunk, encoding, callback) {
                            const hiddenChar = '*'.repeat(chunk.length);
                            this.push(hiddenChar);
                            callback();
                        },
                    })).pipe(stdout);
                    const handleKeypress = async (key) => {
                        const isEnterKey = key.toString() === '\r' || key.toString() === '\n';
                        if (isEnterKey) {
                            stdin.pause();
                            stdout.write('\n');
                            stdin.setRawMode(false);
                            stdin.removeListener('data', handleKeypress);
                            const isValid = await validateAnswer(password);
                            if (isValid) {
                                answers[name] = applyFilter(password);
                                stdin.unpipe();
                                stdout.unpipe();
                                resolve();
                            } else {
                                stdin.unpipe();
                                stdout.unpipe();
                                questionLoop();
                            }
                        } else {
                            password += key.toString();
                        }
                    };
                    stdin.on('data', handleKeypress);
                }
            }

            questionLoop();
        });
    }

    async function askQuestions() {
        for (const question of questions) {
            await askQuestion(question);
        }
        return answers;
    }

    return askQuestions();
};

var network = {};

const os = require$$3,
        net = require$$1$1;
/**
 * Get the IP address
 * @return {null|string}
 */
network.getIPAddress = () => {
    const interfaces = os.networkInterfaces();
    for (const interfaceName in interfaces) {
        const interfaceInfo = interfaces[interfaceName];
        for (const iFace of interfaceInfo) {
            if (iFace.family === 'IPv4' && !iFace.internal) {
                return iFace.address;
            }
        }
    }
    return null;
};
/**
 * Is the port free
 * @param port
 * @param hostname
 * @return {Promise<unknown>}
 */
network.isPortFree = async (port, hostname = 'localhost') => {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.listen(port, hostname);
        server.on('listening', () => {
            server.close();
            resolve(true);
        });
        server.on('error', () => {
            resolve(false);
        });
    });
};

var dir = {exports: {}};

(function (module) {
	const {join, normalize, dirname} = require$$0$1,
	      {readdirSync, statSync, lstatSync, mkdirSync, existsSync} = require$$2,
	      path = require$$0$1;
	/**
	 * Negate a function
	 * @param {function} fn - function to wrap
	 * @returns {function(...[*]): boolean}
	 */
	const not = (fn) => (...args) => !fn(...args);
	/**
	 * Test if the path exists, can be used on a directory or file
	 * @param {string|Buffer|URL} dir - The directory to read
	 * @returns {boolean} indicates if the directory exists
	 */
	module.exports.ifExist = (dir) => existsSync(dir);
	/**
	 * Test if the directory or file does not exist
	 * @param {string|Buffer|URL} dir - The directory to read
	 * @returns {boolean} indicates if the directory exists
	 */
	module.exports.ifNotExist = not(module.exports.ifExist);
	/**
	 * test if the give item is directory, testing it even exists first, then get the Stat.
	 * @param {PathLike} item - The directory or file to read
	 * @returns {boolean} indicates if the directory exists
	 */
	module.exports.isDirectory = (item) => existsSync(item) ? statSync(item).isDirectory() : false;
	/**
	 * test if the give item is NOT a directory, testing it even exists first, then get the Stat.
	 * @param {PathLike} item - The directory or file to read
	 * @returns {boolean} indicates if the directory exists
	 */
	module.exports.isNotDirectory = not(module.exports.isDirectory);
	/**
	 * like isDirectory, test if the give item is file, testing it even exists first, then get the Stat.
	 * @param {PathLike} item - The directory or file to read
	 * @returns {boolean} indicates if the directory exists
	 */
	module.exports.isFile = (item) => existsSync(item) ? statSync(item).isFile() : false;
	/**
	 * like isNotDirectory, test if the give item is not a file, testing it even exists first, then get the Stat.
	 * @param {PathLike} item - The directory or file to read
	 * @returns {boolean} indicates if the directory exists
	 */
	module.exports.isNotFile = not(module.exports.isFile);
	/**
	 * Build a file stat
	 * @param realPath
	 * @param filePath
	 * @return {{isFile: boolean, bytes: number, filePath, perms: {u: {r: boolean, w: boolean, x: boolean}, g: {r: boolean, w: boolean, x: boolean}, o: {r: boolean, w: boolean, x: boolean}}, isDir: boolean}}
	 */
	module.exports.buildStat = (realPath, filePath) => {
	    const stat = statSync(join(realPath, filePath));
	    const lstats = lstatSync(join(realPath, filePath));
	    let perms = module.exports.filePermissions(stat);
	    let isFile = stat.isFile();
	    let isDir = stat.isDirectory();
	    let isSymLink = lstats.isSymbolicLink();
	    let bytes = stat.size;
	    const createdTime = stat.birthtime;
	    const modifiedTime = stat.mtime;
	    return {filePath, isDir, isFile, isSymLink, perms, bytes, createdTime, modifiedTime}
	};

	/**
	 * Ensure that the file path exists, if not create it.
	 * @param filePath
	 */
	module.exports.ensurePathExists = function ensurePathExists(filePath) {
	    try {
	        const DirName = dirname(normalize(filePath));
	        if (existsSync(DirName)) {
	            return
	        }
	        module.exports.ensurePathExists(DirName);
	        mkdirSync(DirName);
	    } catch (e) {
	        // swallow the error, I don't care.
	        // with many threads creating directories, there will
	        // be failures.
	    }
	};
	/**
	 * A generator function that walks a directory and yields the file stats
	 * @param basePath
	 * @param fp
	 * @return {AsyncGenerator<{isFile: *, bytes: *, filePath: *, perms: *, isDir: *}|*, void, *>}
	 */
	module.exports.walkDirGen = async function* walkDirGen(basePath, fp) {
	    const files = readdirSync(path.join(basePath, fp));
	    for (const file of files) {
	        const {isDir, isFile, isSymLink, perms, bytes} = module.exports.buildStat(join(basePath, fp), file);
	        if (isFile) {
	            yield {filePath: path.join(fp, file), isDir, isFile, perms, bytes};
	        } else if (isDir && !isSymLink) {
	            yield* walkDirGen(basePath, path.join(fp, file)); // Recursively yield files from subdirectories
	        }
	    }
	};
	/**
	 * make directory recursively
	 * @param directory
	 */
	module.exports.mkDirRecursivelySync = function mkDirRecursivelySync(directory) {
	    mkdirSync(directory, {recursive: true});
	}; 
} (dir));

var dirExports = dir.exports;

var file = {};

const {statSync, utimesSync, constants, chmodSync} = require$$2;
/**
 * Verify the bytes sent match the bytes on the file system
 * @param expectedBytes
 * @param filePath
 * @return {`${string}`}
 */
file.verifyBytes = (expectedBytes, filePath) => {
    const stat = statSync(filePath);
    return `${stat.size === expectedBytes ? "✅" : "❌"}`
};
/**
 * @typedef {Object} User
 * @property {boolean} r - read
 * @property {boolean} w - write
 * @property {boolean} x - execute
 */
/**
 * @typedef {Object} Group
 * @property {boolean} r - read
 * @property {boolean} w - write
 * @property {boolean} x - execute
 */
/**
 * @typedef {Object} Other
 * @property {boolean} r - read
 * @property {boolean} w - write
 * @property {boolean} x - execute
 */
/**
 * @typedef {Object} Permission
 * @property {User} u - The user permissions
 * @property {Group} g - The group permissions
 * @property {Other} o - The other permissions
 */
/**
 * get the file permissions from the file
 * @param {Stats} stats - A fs.Stats object provides information about a file.
 * @see {@link https://nodejs.org/api/fs.html#class-fsstats}
 * @return {Permission} - the permission object
 */
file.filePermissions = (stats) => ({
    // {{u: {r: boolean, w: boolean, x: boolean}, g: {r: boolean, w: boolean, x: boolean}, o: {r: boolean, w: boolean, x: boolean}}}
    u: { // user
        r: !!(stats.mode & 0o400),
        w: !!(stats.mode & 0o200),
        x: !!(stats.mode & 0o100)
    },
    g: { // group
        r: !!(stats.mode & 0o040),
        w: !!(stats.mode & 0o020),
        x: !!(stats.mode & 0o010)
    },
    o: { // other
        r: !!(stats.mode & 0o004),
        w: !!(stats.mode & 0o002),
        x: !!(stats.mode & 0o001)
    }
});
/**
 * Set the permissions on the file based on the permission object
 * @param {Permission} permissions - the permission object
 * @param {PathLike} filePath - the path to the file
 */
file.permissionsToFile = (permissions, filePath) => {
    let mode = 0;
    if (permissions.u.r) {
        mode |= constants.S_IRUSR;
    }
    if (permissions.u.w) {
        mode |= constants.S_IWUSR;
    }
    if (permissions.u.x) {
        mode |= constants.S_IXUSR;
    }
    if (permissions.g.r) {
        mode |= constants.S_IRGRP;
    }
    if (permissions.g.w) {
        mode |= constants.S_IWGRP;
    }
    if (permissions.g.x) {
        mode |= constants.S_IXGRP;
    }
    if (permissions.o.r) {
        mode |= constants.S_IROTH;
    }
    if (permissions.o.w) {
        mode |= constants.S_IWOTH;
    }
    if (permissions.o.x) {
        mode |= constants.S_IXOTH;
    }
    chmodSync(filePath, mode);
};
/**
 * Set the time on the file.
 * @param createdTime
 * @param modifiedTime
 * @param filePath
 */
file.setTimeOnFile = (createdTime, modifiedTime, filePath) => {
    utimesSync(filePath, new Date(createdTime), new Date(modifiedTime));
};

var crypt = {};

const crypto$1 = require$$0$2;
/**
 * encrypt symmetrically, this is not using an IV... so not so safe.
 *
 * @example
 *     const passPhrase = Buffer.from('MrMonkeyGoBoom', 'utf8')
 *     const salt = crypto.randomBytes(16)
 *     const encryptionKey = await generateEncryptionKeyBuffer(passPhrase, salt)
 *
 *     const cypher = encryptValue(JSON.stringify({foo: 'bar'}), encryptionKey, passPhrase)
 *     console.log(JSON.stringify(cypher, null, 4))
 *
 *     const result = JSON.parse(decryptValue(cypher, encryptionKey, passPhrase))
 *     console.log(JSON.stringify(result, null, 4))
 * @param value - the value to encrypt
 * @param {string} passphrase - The passphrase to use
 * @param {string} salt - The salt to use
 * @param {string|ArrayBuffer|Buffer|TypedArray|DataView} [iv=null] - Initialization vector, The IV is typically required to be random or pseudorandom, but sometimes an IV only needs to be unpredictable or unique
 * @param {string} [algorithm='aes-256-cbc'] - NodeJS supported encryption algorithm
 * @return {string} - encrypted value
 */
crypt.encryptValue = (value, passphrase, salt, iv = null, algorithm = 'aes-256-ecb') => {
    const keyBuffer = crypto$1.scryptSync(passphrase, salt, 32);
    const cipher = crypto$1.createCipheriv(algorithm, keyBuffer, iv, {});
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
};

/**
 * decrypt symmetrically, this is not using an IV... so not so safe.
 *
 * @example
 *     const passPhrase = Buffer.from('MrMonkeyGoBoom', 'utf8')
 *     const salt = crypto.randomBytes(16)
 *     const encryptionKey = await generateEncryptionKeyBuffer(passPhrase, salt)
 *
 *     const cypher = encryptValue(JSON.stringify({foo: 'bar'}), encryptionKey, passPhrase)
 *     console.log(JSON.stringify(cypher, null, 4))
 *
 *     const result = JSON.parse(decryptValue(cypher, encryptionKey, passPhrase))
 *     console.log(JSON.stringify(result, null, 4))
 * @param {string} encryptedData - encrypted data
 * @param {string} passphrase - The passphrase to use
 * @param {string} salt - The salt to use
 * @param {string|null} [iv=null] - Initialization vector, The IV is typically required to be random or pseudorandom, but sometimes an IV only needs to be unpredictable or unique
 * @param {string|undefined} [algorithm='aes-256-cbc'] - NodeJS supported encryption algorithm
 * @return {string} - The decrypted value
 */
crypt.decryptValue = (encryptedData, passphrase, salt, iv = null, algorithm = 'aes-256-ecb') => {
    const keyBuffer = crypto$1.scryptSync(passphrase, salt, 32);
    const decipher = crypto$1.createDecipheriv(algorithm, keyBuffer, iv, {});
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted
};

/**
 * Generate a 32 byte key based on the salt and passphrase
 * @param {string} passphrase - The passphrase to use
 * @param {string} salt - The salt to use
 * @param {number} [keyLength=32] - The length of the key to generate
 * @return {Buffer} - The generated key as a buffer
 */
crypt.genKey = (passphrase, salt, keyLength = 32) => {
    return crypto$1.scryptSync(passphrase, salt, keyLength)
};

const cluster = require$$0$3,
        http = require$$1$2,
        {normalize, sep, join} = require$$0$1,
        zlib = require$$3$1,
        fs = require$$2,
        crypto = require$$0$2,
        {prompt} = prompt$1,
        {getIPAddress, isPortFree} = network,
        {ifNotExist, isNotDirectory, ensurePathExists,} = dirExports,
        {permissionsToFile, setTimeOnFile, verifyBytes,} = file,
        {decryptValue, genKey} = crypt;

const pickOneRandomItem = (items) => {
    return items[Math.floor(Math.random() * items.length)]
};

// Set up the Process Signal Traps, so the application can exit gracefully.
const signalTraps = ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGABRT', 'SIGTERM', 'SIGUSR2'];
signalTraps.forEach(function (signal) {
    process.on(signal, function () {
        process.exit(0);
    });
});

const WorkersMap = new Map();

if (cluster.isMaster) {

    const launchWorker = (map, env) => {
        const newWorker = cluster.fork(env);
        map.set(newWorker.process.pid, [env, newWorker, 'FREE']);
        newWorker.on('message', onWorkerMessage(newWorker.process.pid));
        newWorker.on("exit", onWorkerExit(newWorker.process.pid, map));
    };
    const replaceWorker = (pid, map) => {
        const [env,] = map.get(pid);
        map.delete(pid);
        const newWorker = cluster.fork(env);
        map.set(newWorker.process.pid, [env, newWorker, 'FREE']);
        newWorker.on('message', onWorkerMessage(newWorker.process.pid));
        newWorker.on("exit", onWorkerExit(newWorker.process.pid, map));
    };
    const onWorkerMessage = (pid) => ({msg}) => {
        const [env, newWorker,] = WorkersMap.get(pid);
        WorkersMap.set(pid, [env, newWorker, msg]);
    };
    const onWorkerExit = (pid, map) => (code, signal) => {
        console.log(`worker ${pid} died ${code} ${signal}`);
        replaceWorker(pid, map);
    };
    const getProgramParameters = async () => {
        // this allows us to pass in arguments for testing purposes
        const [, , ...args] = process.argv;
        if (args.length === 1 && args[0] === '--headless') {
            console.log('Running in headless mode');
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
        }]);
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
        },]);
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
        ]);
        const encryptionAlgorithm = 'aes-256-cbc';
        return {hostname, port, passphrase, salt, directory, encryptionAlgorithm}
    };
    getProgramParameters()
        .then(({hostname, port, passphrase, salt, directory, encryptionAlgorithm}) => {
            const workDispatchServer = http.createServer((req, res) => {
                const freeServers = Array.from(WorkersMap.entries()).filter(([, [, , status]]) => status === 'FREE').map(([, [env, ,]]) => env.PORT).map((p) => `http://${hostname}:${p}/`);
                if (freeServers.length === 0) {
                    res.writeHead(503);
                    res.end(`busy`);
                    return
                }
                const Location = pickOneRandomItem(freeServers);
                console.log(`dispatching worker to ${Location}`);
                res.writeHead(302, {
                    Location
                });
                res.end();
            });
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
                    };
                    launchWorker(WorkersMap, env);
                }
            });
        });
} else {
    const throwHttpError = (httpMessage, httpStatusCode = 500) => {
        const err = new Error(httpMessage);
        err.httpMessage = httpMessage;
        err.httpStatusCode = httpStatusCode;
        throw err
    };
    const worker = function worker(hostname, port, passphrase, salt, directory, encryptionAlgorithm) {
        console.log(`Starting worker`);
        const start = () => server.listen(port, () => console.log(`Worker listening http://${hostname}:${port}/`));
        const server = http.createServer((req, res) => {
            console.log('incoming request to a worker');
            try {
                process.send({msg: 'BUSY'});
                const headerValue = req.headers['meta'] || throwHttpError('Missing required "META" header', 400);
                const {
                    filePath, perms, bytes, iv, createdTime, modifiedTime
                } = JSON.parse(decryptValue(headerValue, passphrase, salt));
                ensurePathExists(join(directory, filePath));
                const compressedEncryptedStream = req
                        .pipe(zlib.createGunzip())
                        .pipe(crypto.createDecipheriv(encryptionAlgorithm, genKey(passphrase, salt), Buffer.from(iv, 'hex'), {}))
                        .pipe(fs.createWriteStream(join(directory, filePath)));
                compressedEncryptedStream.on('finish', () => {
                    permissionsToFile(perms, join(directory, filePath));
                    setTimeOnFile(createdTime, modifiedTime, join(directory, filePath));
                    console.log(`Received ${filePath} ${verifyBytes(bytes, join(directory, filePath))}`);
                    // set the file permissions and ownership
                    res.writeHead(200);
                    res.end(JSON.stringify({message: 'done'}));
                });
            } catch (err) {
                console.log(err);
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(err.httpStatusCode || 500);
                res.end(JSON.stringify({error: err.httpMessage || err.message || 'Error'}));
            } finally {
                process.send({msg: 'FREE'});
            }
        });
        server.on('error', (e) => {
            if (e.code === 'EADDRINUSE') {
                console.log(`Worker address ${port} in use, retrying...`);
                setTimeout(() => {
                    server.close();
                    start();
                }, 1000);
            }
            throw e
        });
        start();
    };
    worker(process.env.HOSTNAME, process.env.PORT, process.env.PASSPHRASE, process.env.SALT, process.env.DIRECTORY, process.env.ENCRYPTIONALGORITHM);
}

module.exports = server;
