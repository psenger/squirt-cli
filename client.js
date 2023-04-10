const {WalkDirGen} = require('./lib/dir')
const {CreatClient, GetLocalIP, WaitForOk} = require('./lib/net')

const Directory = './source'
const ConnectOptions = {host: GetLocalIP(), port: 8000}
const asyncEnd = async (client) => {
    return new Promise((resolve, reject) => {
        client.end(() => resolve('Client closed'));
    });
}
const run = async () => {
    const client = await CreatClient(ConnectOptions)
    for await (let {filePath, isDir, isFile, perms, bytes} of WalkDirGen(Directory)) {
        console.log(filePath, isDir, isFile, perms, bytes);
        client.write('JSON');
        await WaitForOk(client)
        client.write(JSON.stringify({filePath, isDir, isFile, perms, bytes}))
        await WaitForOk(client)
    }
    client.write('DONE')
    return asyncEnd(client)
}

run().then(console.log).catch(console.error)
