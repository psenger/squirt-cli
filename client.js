#!/usr/bin/env node

const zlib = require('zlib'),
        fs = require('fs'),
        crypto = require('crypto'),
        {encryptValue, genKey} = require('./lib/crypt'),
        {forPassphrase, forSalt,forDir, confirmOrChangePrompt} = require('./lib/prompt'),
        {BuildFileStat, walkDirGen} = require("./lib/dir"),
        http = require('http');
const path = require("path");

const run = async () => {

    const port = await confirmOrChangePrompt('Enter the http Port', 3000)
    const passphrase = await forPassphrase()
    const salt = await forSalt()
    const directory = await forDir()
    const encryptionAlgorithm = 'aes-256-cbc'
    const ServerUrl = `http://localhost:${port}/`

    /**
     * the Key is what comes from the Server starting up...
     * @type {string}
     */
    const encryptionKey = genKey( passphrase, salt )
    const iv = crypto.randomBytes(16)

    for await (let {filePath, isDir, isFile, perms, bytes} of walkDirGen(directory,'.')) {
        console.log(`Sending ${filePath}`)
        /**
         * this is a little complicated:
         *   the Meta Header does not have an IV, which is absolutely required if the data inside repeats.
         *   SO, I slap in a NONCE. Yes a nonce should be the first thing, and this is JSON... but
         *   it will do for now.
         *
         *   I do generate an IV ( as an attribute in the JSON payload ) as part of the Meta Header,
         *   this IV is used to encrypt the following data in the stream.. which is good, because in theory
         *   we could transmit a file that has a bunch of repeating stuff in it and could be cracked.
         */
        const nonce = {
            [crypto.randomBytes(16).toString('hex')]: crypto.randomBytes(16).toString('hex')
        }
        const meta = encryptValue(JSON.stringify({
            ...nonce,
            ...BuildFileStat(directory,filePath),
            iv: iv.toString('hex')
        }), passphrase, salt)
        await new Promise((resolve, reject) => {
            const req = http.request(ServerUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    meta
                }
            }, (res) => {
                let statusCode = res.statusCode;
                let body = '';
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => {
                    resolve({body, statusCode})
                });
            });
            req.on('error', reject);
            fs.createReadStream(path.normalize(path.join(directory,filePath)))
                    .pipe(crypto.createCipheriv(encryptionAlgorithm, encryptionKey, iv, {}))
                    .pipe(zlib.createGzip())
                    .pipe(req)
        })
    }
}
run()
        .then(response => {
            console.log('Success:', response);
        })
        .catch(error => {
            console.error('Error:', error);
        });
