const {join,normalize, dirname} = require('path'),
        {readdirSync, statSync, mkdirSync, existsSync} = require('fs'),
        fs = require("fs");
const not = (fn) => (...args) => !fn(...args)
module.exports.ifExist = (dir) => fs.existsSync(dir)
module.exports.ifNotExist = not(module.exports.ifExist)
module.exports.isDirectory = (item) => fs.existsSync(item) ? fs.statSync(item).isDirectory() : false
module.exports.isNotDirectory = not(module.exports.isDirectory)
module.exports.isFile = (item) => fs.existsSync(item) ? fs.statSync(item).isFile() : false
module.exports.isNotFile = not(module.exports.isFile)
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
 * Build a file stat
 * @param path
 * @param filePath
 * @return {{isFile: boolean, bytes: number, filePath, perms: {u: {r: boolean, w: boolean, x: boolean}, g: {r: boolean, w: boolean, x: boolean}, o: {r: boolean, w: boolean, x: boolean}}, isDir: boolean}}
 * @constructor
 */
module.exports.BuildFileStat = (path,filePath) => {
    const stat = statSync(join(path,filePath));
    let perms = module.exports.filePermissions(stat)
    let isFile = stat.isFile()
    let isDir = stat.isDirectory()
    let bytes = stat.size
    return {filePath, isDir, isFile, perms, bytes}
}
/**
 * Ensure that the file path exists, if not create it.
 * @param filePath
 */
module.exports.ensurePathExists = function ensurePathExists (filePath) {
    const DirName = dirname(normalize(filePath));
    if (fs.existsSync(DirName)) {
        return;
    }
    module.exports.ensurePathExists(DirName);
    fs.mkdirSync(DirName);
}
/**
 * A generator function that walks a directory and yields the file stats
 * @param basePath
 * @param fp
 * @return {AsyncGenerator<{isFile: *, bytes: *, filePath: *, perms: *, isDir: *}|*, void, *>}
 */
module.exports.walkDirGen = async function* walkDirGen(basePath,fp) {
    const {filePath, isDir, isFile, perms, bytes} = module.exports.BuildFileStat(basePath,fp)
    if (isFile) {
        yield {filePath, isDir, isFile, perms, bytes};
    } else if (isDir) {
        // if you yield here you get directories.
        // yield {filePath, isDir, isFile, perms, bytes};
        const filenames = readdirSync(join(basePath,fp));
        for (const filename of filenames) {
            const file = module.exports.walkDirGen(basePath, filePath + '/' + filename);
            for await (const f of file) {
                yield f;
            }
        }
    }
}
/**
 * make directory recursively
 * @param directory
 */
module.exports.mkDirRecursivelySync = function mkDirRecursivelySync(directory) {
    fs.mkdirSync(directory, {recursive: true})
}
