const {statSync, utimesSync, constants, chmodSync} = require('fs');
/**
 * Verify the bytes sent match the bytes on the file system
 * @param expectedBytes
 * @param filePath
 * @return {`${string}`}
 */
module.exports.verifyBytes = (expectedBytes, filePath) => {
    const stat = statSync(filePath)
    return `${stat.size === expectedBytes ? "✅" : "❌"}`
}
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
module.exports.filePermissions = (stats) => ({
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
})
/**
 * Set the permissions on the file based on the permission object
 * @param {Permission} permissions - the permission object
 * @param {PathLike} filePath - the path to the file
 */
module.exports.permissionsToFile = (permissions, filePath) => {
    let mode = 0
    if (permissions.u.r) {
        mode |= constants.S_IRUSR
    }
    if (permissions.u.w) {
        mode |= constants.S_IWUSR
    }
    if (permissions.u.x) {
        mode |= constants.S_IXUSR
    }
    if (permissions.g.r) {
        mode |= constants.S_IRGRP
    }
    if (permissions.g.w) {
        mode |= constants.S_IWGRP
    }
    if (permissions.g.x) {
        mode |= constants.S_IXGRP
    }
    if (permissions.o.r) {
        mode |= constants.S_IROTH
    }
    if (permissions.o.w) {
        mode |= constants.S_IWOTH
    }
    if (permissions.o.x) {
        mode |= constants.S_IXOTH
    }
    chmodSync(filePath, mode)
}
/**
 * Set the time on the file.
 * @param createdTime
 * @param modifiedTime
 * @param filePath
 */
module.exports.setTimeOnFile = (createdTime, modifiedTime, filePath) => {
    utimesSync(filePath, new Date(createdTime), new Date(modifiedTime))
}
