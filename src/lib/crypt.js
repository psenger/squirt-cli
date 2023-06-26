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
 * @param value - the value to encrypt
 * @param {string} passphrase - The passphrase to use
 * @param {string} salt - The salt to use
 * @param {string|ArrayBuffer|Buffer|TypedArray|DataView} [iv=null] - Initialization vector, The IV is typically required to be random or pseudorandom, but sometimes an IV only needs to be unpredictable or unique
 * @param {string} [algorithm='aes-256-cbc'] - NodeJS supported encryption algorithm
 * @return {string} - encrypted value
 */
module.exports.encryptValue = (value, passphrase, salt, iv = null, algorithm = 'aes-256-ecb') => {
    const keyBuffer = crypto.scryptSync(passphrase, salt, 32);
    const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv, {});
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
 * @param {string} encryptedData - encrypted data
 * @param {string} passphrase - The passphrase to use
 * @param {string} salt - The salt to use
 * @param {string|null} [iv=null] - Initialization vector, The IV is typically required to be random or pseudorandom, but sometimes an IV only needs to be unpredictable or unique
 * @param {string|undefined} [algorithm='aes-256-cbc'] - NodeJS supported encryption algorithm
 * @return {string} - The decrypted value
 */
module.exports.decryptValue = (encryptedData, passphrase, salt, iv = null, algorithm = 'aes-256-ecb') => {
    const keyBuffer = crypto.scryptSync(passphrase, salt, 32)
    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv, {})
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
}

/**
 * Generate a 32 byte key based on the salt and passphrase
 * @param {string} passphrase - The passphrase to use
 * @param {string} salt - The salt to use
 * @param {number} [keyLength=32] - The length of the key to generate
 * @return {Buffer} - The generated key as a buffer
 */
module.exports.genKey = (passphrase, salt, keyLength = 32) => {
    return crypto.scryptSync(passphrase, salt, keyLength)
}


