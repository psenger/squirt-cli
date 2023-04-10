const {join, isAbsolute,sep,
    resolve} = require('path')
const {readdirSync, statSync, mkdirSync,
    existsSync} = require('fs')
const filePermissions = (stats) => ({
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
 * @example
 * walkDir('./source', ({filePath, isDir, isFile, perms, bytes}) => {
 *     console.log(filePath, isDir, isFile, perms, bytes)
 * });
 * @param dir
 * @param callback
 */
function walkDir(dir, callback) {
    readdirSync(dir).forEach(file => {
        const filePath = join(dir, file);
        const stat = statSync(filePath);
        let perms = filePermissions(stat);
        let isFile = stat.isFile();
        let isDir = stat.isDirectory();
        let bytes = stat.size
        if (isDir) {
            callback({filePath, isDir, isFile, perms, bytes});
            walkDir(filePath, callback);
        } else {
            callback({filePath, isDir, isFile, perms, bytes});
        }
    });
}

/**
 * @example
 * const {walkDirGen} = require("./dir");
 * (async () => {
 *     for await (const file of walkDirGen('./source')) {
 *         console.log(file);
 *     }
 * })();
 * @param filePath
 * @return {AsyncGenerator<{isFile: boolean, bytes: number, filePath: *, perms: {u: {r, w, x}, g: {r, w, x}, o: {r, w, x}}, isDir: boolean}|{isFile: boolean, bytes: number, filePath: *, perms: {u: {r, w, x}, g: {r, w, x}, o: {r, w, x}}, isDir: boolean}|*, void, *>}
 */
async function* WalkDirGen(filePath) {
    const stat = statSync(filePath);
    let perms = filePermissions(stat)
    let isFile = stat.isFile()
    let isDir = stat.isDirectory()
    let bytes = stat.size
    if (isFile) {
        yield {filePath, isDir, isFile, perms, bytes};
    } else if (isDir) {
        yield {filePath, isDir, isFile, perms, bytes};
        const filenames = readdirSync(filePath);
        for (const filename of filenames) {
            const file = WalkDirGen(filePath + '/' + filename);
            for await (const f of file) {
                yield f;
            }
        }
    }
}
const mkDirRecursivelySync = (dirPath) => {
    if (!isAbsolute(dirPath)) {
        dirPath = resolve(process.cwd(), dirPath);
    }
    const parts = dirPath.split(sep).filter(Boolean);
    for (let i = 1; i <= parts.length; i++) {
        const segment = join(...[sep,...parts.slice(0, i)], sep);
        if (!existsSync(segment)) {
            mkdirSync(segment);
        }
    }
}
module.exports = {
    walkDir,
    WalkDirGen,
    mkDirRecursivelySync
}



