#!/usr/bin/env node

'use strict';

var require$$0$3 = require('zlib');
var require$$1$1 = require('fs');
var require$$0 = require('crypto');
var require$$0$1 = require('readline');
var require$$1 = require('child_process');
var require$$3 = require('os');
var require$$4 = require('stream');
var require$$0$2 = require('path');
var require$$7 = require('http');

var client = {};

var crypt = {};

const crypto$1 = require$$0;
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

var prompt$1 = {};

const readline = require$$0$1,
        {spawnSync} = require$$1,
        fs$1 = require$$1$1,
        os = require$$3,
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
                        const tempFilePath = fs$1.mkdtempSync(`${os.tmpdir()}/`);
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

var dir = {exports: {}};

(function (module) {
	const {join, normalize, dirname} = require$$0$2,
	      {readdirSync, statSync, lstatSync, mkdirSync, existsSync} = require$$1$1,
	      path = require$$0$2;
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

var glob = {};

/**
 * Convert a glob to a regex, the directory separator
 * @param string
 * @returns {*}
 */

const directorySeparator = string => string.replace(/\//g, '\\/');
/**
 * Convert a glob to a regex, the dot construct
 * @param string
 * @returns {*}
 */
const dot = string => string.replace(/\./g, '\\.');
/**
 * Convert a glob to a regex, the ** or splat splat
 * @param string
 * @returns {*}
 */
const splatSplat = string => string.replace(/\*{2}/g, ".*");
/**
 * Convert a glob to a regex, the ?
 * @param string
 * @returns {*}
 */
const question = string => string.replace(/\?/g, ".{1}");
/**
 * Convert a glob to a regex, the * or splat
 * @param string
 * @returns {*}
 */
const splat = string => string.replace(/(?<!\*)\*(?!\*)/g, "[^\\/]*");
/**
 * Convert a glob to a regex, group construct
 * @param string
 * @returns {*}
 */
const extensionGroup = string => string.replace(/\{(.*)\}/g, '($1)');
/**
 * Convert a glob to a regex, the inverse group construct
 * @param string
 * @returns {*}
 */
const negativeUnixLike = string => string.replace(/\[!(.*)\]/g, '[^($1)]');

/**
 * Converts a glob to a regex
 * @param glob {string} - The glob to convert
 * @returns {string}
 */
glob.globToRegex = (glob) => { //, options) => {
    // const absolute = options && options.absolute ? '^' : '';
    return `^${[extensionGroup, dot, directorySeparator, splat, splatSplat, question, negativeUnixLike]
            .reduce((acc, cur) => {
                return cur(acc)
            }, glob)}$`
};

const zlib = require$$0$3,
        fs = require$$1$1,
        crypto = require$$0,
        {encryptValue, genKey} = crypt,
        {prompt} = prompt$1,
        {buildStat, walkDirGen, isNotDirectory, ifNotExist} = dirExports,
        {globToRegex} = glob,
        http = require$$7,
        {join, normalize, sep} = require$$0$2;

// Set up the Process Signal Traps, so the application can exit gracefully.
const signalTraps = ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGABRT', 'SIGTERM', 'SIGUSR2'];
signalTraps.forEach(function (signal) {
    process.on(signal, function () {
        process.exit(0);
    });
});

const getProgramParameters = async () => {
    // --headless allows passing parameters via environment
    //   variables. This should only be done for testing,
    //   environment variables are not secure, as a process
    //   explorer ( via the super used ) can see them
    const [, , ...args] = process.argv;
    if (args.length === 1 && args[0] === '--headless') {
        console.log('Running in headless mode');
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
    ]);
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
        ]);
        globPatterns.push(...answer.globPatterns.map(globToRegex).map(globPattern => new RegExp(globPattern)));
    } else {
        globPatterns.push(new RegExp(globToRegex('**')));
    }
    const MaxWorkers = 4;
    const encryptionAlgorithm = 'aes-256-cbc';
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
};
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
            const encryptionKey = genKey(passphrase, salt);
            const iv = crypto.randomBytes(16);
            const isMatch = (filePath) => globPatterns.some(globPattern => globPattern.test(filePath));
            const promises = [];
            for await (let {filePath, perms} of walkDirGen(directory, '.')) {
                if (!isMatch(filePath)) {
                    console.log(`Skipping ${filePath}, did not match any GLOBs`);
                    continue
                }
                if (dryRun) {
                    console.log(filePath);
                    continue
                }
                if (!perms.o.r || !perms.g.r || !perms.u.r) {
                    console.log(`Skipping ${filePath}, insufficient permissions to read the file`);
                    continue
                }
                promises.push(new Promise(async (resolve, reject) => {
                    console.log(`Sending ${filePath}`);
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
                    };
                    const meta = encryptValue(JSON.stringify({
                        ...nonce,
                        ...buildStat(directory, filePath),
                        iv: iv.toString('hex')
                    }), passphrase, salt);

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
                                    delete getNextWorker.timeout; // Reset timeout value if successful
                                    resolve(res.headers.location);
                                } else if (res.statusCode === 503) {
                                    setTimeout(() => {
                                        resolve(getNextWorker({hostname, port, pathname}));
                                    }, getNextWorker.timeout);
                                } else {
                                    reject(new Error(`Unable to get worker, status code ${res.statusCode}`));
                                }
                            });
                            req.on('error', (e) => {
                                console.error(`problem with request: ${e.message}`);
                                reject(new Error(`Unable to get worker, error message ${e.message}`));
                            });
                            req.end();
                        })
                    };
                    const url = await getNextWorker(new URL(serverUrl));
                    const options = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/octet-stream',
                            meta
                        }
                    };
                    const callBack = (res) => {
                        let statusCode = res.statusCode;
                        let body = '';
                        res.on('data', (chunk) => {
                            body += chunk;
                        });
                        res.on('end', () => {
                            resolve({body, statusCode});
                        });
                    };
                    const req = http.request(url, options, callBack);
                    req.on('error', reject);
                    fs.createReadStream(normalize(join(directory, filePath)))
                            .pipe(crypto.createCipheriv(encryptionAlgorithm, encryptionKey, iv, {}))
                            .pipe(zlib.createGzip())
                            .pipe(req);
                }));
                if (promises.length >= MaxWorkers) {
                    await Promise.all(promises);
                    promises.length = 0;
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            process.exit(1);
        });

module.exports = client;
