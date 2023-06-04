#!/usr/bin/env node

const   zlib = require('zlib'),
        fs = require('fs'),
        http = require('http'),
        crypto = require('crypto'),
        {join} = require('path'),
        {decryptValue, genKey} = require('./lib/crypt'),
        {forPassphrase, forSalt, forDir, confirmOrChangePrompt} = require('./lib/prompt'),
        {ensurePathExists} = require('./lib/dir');

const run = async () => {
    try {
        const strPort = await confirmOrChangePrompt('Enter the http Port', 3000)
        const passphrase = await forPassphrase()
        const salt = await forSalt()
        const directory = await forDir()
        const encryptionAlgorithm = 'aes-256-cbc'
        const port = Number.parseInt(strPort,10)
        const throwHttpError = (httpMessage, httpStatusCode = 500 ) => {
            const err = new Error(httpMessage)
            err.httpMessage = httpMessage
            err.httpStatusCode = httpStatusCode
            throw err
        }
        const server = http.createServer((req, res) => {
            try {
                const headerValue = req.headers['meta'] || throwHttpError('Missing required "META" header', 400)
                const {filePath, isDir, isFile, perms, bytes, iv} = JSON.parse(decryptValue(headerValue, passphrase, salt))
                ensurePathExists(join(directory,filePath))
                const compressedEncryptedStream = req
                        .pipe(zlib.createGunzip())
                        .pipe(crypto.createDecipheriv(encryptionAlgorithm, genKey(passphrase,salt), Buffer.from(iv, 'hex'), {}))
                        .pipe(fs.createWriteStream(join(directory,filePath)))
                compressedEncryptedStream.on('finish', () => {
                    console.log(`Received ${filePath}`)
                    // set the file permissions and ownership
                    res.writeHead(200)
                    res.end(JSON.stringify({message: 'done'}))
                })
            } catch (err) {
                console.log(err)
                res.setHeader('Content-Type', 'application/json')
                res.writeHead(err.httpStatusCode || 500)
                res.end(JSON.stringify({ error: err.httpMessage || err.message || 'Error' }))
            }
        })
        server.listen(port, () => {
            console.log(`Server listening on port ${port}`)
        })
    } catch (err) {
        console.log(err)
        process.exit(1)
    }
}

run()
