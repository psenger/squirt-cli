const {WalkDirGen} = require('./dir')
const {CreatClient, GetLocalIP, WaitForOk} = require('./net')

const asyncEnd = async (client) => {
    return new Promise((resolve, reject) => {
        client.end(() => resolve('Client closed'));
    });
}
module.exports = async ({directory, port}) => {
    try {
        const ConnectOptions = {host: GetLocalIP(), port}
        const run = async () => {
            const client = await CreatClient(ConnectOptions)
            for await (let {filePath, isDir, isFile, perms, bytes} of WalkDirGen(directory)) {
                console.log(filePath, isDir, isFile, perms, bytes);
                client.write('JSON');
                await WaitForOk(client)
                client.write(JSON.stringify({filePath, isDir, isFile, perms, bytes}))
                await WaitForOk(client)
            }
            client.write('DONE')
            return asyncEnd(client)
        }
        console.log(await run())
    } catch (error) {
        console.error(error)
    }
}
