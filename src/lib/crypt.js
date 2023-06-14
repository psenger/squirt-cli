const crypto = require('crypto');
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
 * @param value
 * @param passphrase
 * @param salt
 * @param [iv=null]
 * @param [algorithm='aes-256-cbc']
 * @return encrypted
 */
module.exports.encryptValue = (value, passphrase, salt, iv = null, algorithm = 'aes-256-ecb') => {
    const keyBuffer = crypto.scryptSync(passphrase, salt, 32);
    const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv );
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

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
 * @param encryptedData
 * @param passphrase
 * @param salt
 * @param [iv=null]
 * @param [algorithm='aes-256-cbc']
 * @return {string}
 */
module.exports.decryptValue = (encryptedData, passphrase, salt, iv = null, algorithm = 'aes-256-ecb') => {
    const keyBuffer = crypto.scryptSync(passphrase, salt, 32);
    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv );
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

/**
 * Generate a 32 byte key based on the salt and passphrase
 * @param passphrase
 * @param salt
 * @param [keyLength=32]
 * @return {Buffer}
 */
module.exports.genKey = (passphrase, salt, keyLength = 32) => {
    return crypto.scryptSync(passphrase, salt, keyLength)
}


