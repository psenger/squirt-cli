const {join,normalize, dirname} = require('path'),
      {readdirSync, statSync, lstatSync, mkdirSync, existsSync, utimesSync, constants, chmodSync} = require('fs');
const path = require("path");
const not = (fn) => (...args) => !fn(...args)
module.exports.ifExist = (dir) => existsSync(dir)
module.exports.ifNotExist = not(module.exports.ifExist)
module.exports.isDirectory = (item) => existsSync(item) ? statSync(item).isDirectory() : false
module.exports.isNotDirectory = not(module.exports.isDirectory)
module.exports.isFile = (item) => existsSync(item) ? statSync(item).isFile() : false
module.exports.isNotFile = not(module.exports.isFile)
/**
 * get the file permissions from the file
 * @param stats
 * @return {{u: {r: boolean, w: boolean, x: boolean}, g: {r: boolean, w: boolean, x: boolean}, o: {r: boolean, w: boolean, x: boolean}}}
 */
module.exports.filePermissions = (stats) => ({
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
 * Set the permissions on the file.
 * @param permissions
 * @param filePath
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
/**
 * Build a file stat
 * @param realPath
 * @param filePath
 * @return {{isFile: boolean, bytes: number, filePath, perms: {u: {r: boolean, w: boolean, x: boolean}, g: {r: boolean, w: boolean, x: boolean}, o: {r: boolean, w: boolean, x: boolean}}, isDir: boolean}}
 * @constructor
 */
module.exports.buildFileStat = (realPath,filePath) => {
    const stat = statSync(join(realPath,filePath))
    const lstats = lstatSync(join(realPath,filePath))
    let perms = module.exports.filePermissions(stat)
    let isFile = stat.isFile()
    let isDir = stat.isDirectory()
    let isSymLink = lstats.isSymbolicLink()
    let bytes = stat.size
    const createdTime = stat.birthtime
    const modifiedTime = stat.mtime
    return {filePath, isDir, isFile, isSymLink, perms, bytes, createdTime, modifiedTime}
}
/**
 * Verify the bytes sent match the bytes on the file system
 * @param expectedBytes
 * @param filePath
 * @return {`${string}`}
 */
module.exports.verifyBytes = (expectedBytes, filePath) => {
    const stat = statSync(filePath)
    return `${stat.size === expectedBytes ? "✅" : "❌" }`
}
/**
 * Ensure that the file path exists, if not create it.
 * @param filePath
 */
module.exports.ensurePathExists = function ensurePathExists (filePath) {
    const DirName = dirname(normalize(filePath))
    if (existsSync(DirName)) {
        return
    }
    module.exports.ensurePathExists(DirName)
    mkdirSync(DirName)
}
/**
 * A generator function that walks a directory and yields the file stats
 * @param basePath
 * @param fp
 * @return {AsyncGenerator<{isFile: *, bytes: *, filePath: *, perms: *, isDir: *}|*, void, *>}
 */
module.exports.walkDirGen = async function* walkDirGen(basePath,fp) {
    const files = readdirSync(path.join(basePath, fp))
    for (const file of files) {
        const {isDir, isFile, isSymLink, perms, bytes} = module.exports.buildFileStat(join(basePath, fp), file)
        if (isFile) {
            yield {filePath: path.join(fp, file), isDir, isFile, perms, bytes}
        } else if (isDir && !isSymLink) {
            yield* walkDirGen( basePath, path.join( fp, file ) ); // Recursively yield files from subdirectories
        }
    }
}
/**
 * make directory recursively
 * @param directory
 */
module.exports.mkDirRecursivelySync = function mkDirRecursivelySync(directory) {
    mkdirSync(directory, {recursive: true})
}

const directoryseperator = string => string.replace(/\//g, '\\/')
const dot = string => string.replace(/\./g, '\\.')
const splatsplat = string => string.replace(/\*{2}/g, ".*")
const question = string => string.replace(/\?/g, ".{1}")
const splat = string => string.replace(/(?<!\*)\*(?!\*)/g, "[^\\/]*")
const extensionGroup = string => string.replace(/\{(.*)\}/g, '($1)');
const negativeUnixLike = string => string.replace(/\[!(.*)\]/g, '[^($1)]');

/**
 * Converts a glob to a regex
 * @param glob {string} - The glob to convert
 * @returns {string}
 */
module.exports.globToRegex = (glob) => { //, options) => {
    // const absolute = options && options.absolute ? '^' : '';
    return `^${[extensionGroup, dot, directoryseperator, splat, splatsplat, question, negativeUnixLike]
            .reduce((acc, cur) => {
                return cur(acc)
            }, glob)}$`
}
