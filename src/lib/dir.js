const {join, normalize, dirname} = require('path'),
      {readdirSync, statSync, lstatSync, mkdirSync, existsSync} = require('fs'),
      path = require("path");
/**
 * Negate a function
 * @param {function} fn - function to wrap
 * @returns {function(...[*]): boolean}
 */
const not = (fn) => (...args) => !fn(...args)
/**
 * Test if the path exists, can be used on a directory or file
 * @param {string|Buffer|URL} dir - The directory to read
 * @returns {boolean} indicates if the directory exists
 */
module.exports.ifExist = (dir) => existsSync(dir)
/**
 * Test if the directory or file does not exist
 * @param {string|Buffer|URL} dir - The directory to read
 * @returns {boolean} indicates if the directory exists
 */
module.exports.ifNotExist = not(module.exports.ifExist)
/**
 * test if the give item is directory, testing it even exists first, then get the Stat.
 * @param {PathLike} item - The directory or file to read
 * @returns {boolean} indicates if the directory exists
 */
module.exports.isDirectory = (item) => existsSync(item) ? statSync(item).isDirectory() : false
/**
 * test if the give item is NOT a directory, testing it even exists first, then get the Stat.
 * @param {PathLike} item - The directory or file to read
 * @returns {boolean} indicates if the directory exists
 */
module.exports.isNotDirectory = not(module.exports.isDirectory)
/**
 * like isDirectory, test if the give item is file, testing it even exists first, then get the Stat.
 * @param {PathLike} item - The directory or file to read
 * @returns {boolean} indicates if the directory exists
 */
module.exports.isFile = (item) => existsSync(item) ? statSync(item).isFile() : false
/**
 * like isNotDirectory, test if the give item is not a file, testing it even exists first, then get the Stat.
 * @param {PathLike} item - The directory or file to read
 * @returns {boolean} indicates if the directory exists
 */
module.exports.isNotFile = not(module.exports.isFile)
/**
 * Build a file stat
 * @param realPath
 * @param filePath
 * @return {{isFile: boolean, bytes: number, filePath, perms: {u: {r: boolean, w: boolean, x: boolean}, g: {r: boolean, w: boolean, x: boolean}, o: {r: boolean, w: boolean, x: boolean}}, isDir: boolean}}
 */
module.exports.buildStat = (realPath, filePath) => {
    const stat = statSync(join(realPath, filePath))
    const lstats = lstatSync(join(realPath, filePath))
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
 * Ensure that the file path exists, if not create it.
 * @param filePath
 */
module.exports.ensurePathExists = function ensurePathExists(filePath) {
    try {
        const DirName = dirname(normalize(filePath))
        if (existsSync(DirName)) {
            return
        }
        module.exports.ensurePathExists(DirName)
        mkdirSync(DirName)
    } catch (e) {
        // swallow the error, I don't care.
        // with many threads creating directories, there will
        // be failures.
    }
}
/**
 * A generator function that walks a directory and yields the file stats
 * @param basePath
 * @param fp
 * @return {AsyncGenerator<{isFile: *, bytes: *, filePath: *, perms: *, isDir: *}|*, void, *>}
 */
module.exports.walkDirGen = async function* walkDirGen(basePath, fp) {
    const files = readdirSync(path.join(basePath, fp))
    for (const file of files) {
        const {isDir, isFile, isSymLink, perms, bytes} = module.exports.buildStat(join(basePath, fp), file)
        if (isFile) {
            yield {filePath: path.join(fp, file), isDir, isFile, perms, bytes}
        } else if (isDir && !isSymLink) {
            yield* walkDirGen(basePath, path.join(fp, file)); // Recursively yield files from subdirectories
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

