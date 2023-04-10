const {WalkDirGen} = require('./dir')
const {CreatClient, GetLocalIP, WaitForOk} = require('./net')

module.exports = async ({directory, port}) => {
    try {
        const ConnectOptions = {host: GetLocalIP(), port}
        const client = await CreatClient(ConnectOptions)
        for await (let {filePath, isDir, isFile, perms, bytes} of WalkDirGen(directory)) {
            console.log(filePath, isDir, isFile, perms, bytes);
            client.write('JSON');
            await WaitForOk(client)
            client.write(JSON.stringify({filePath, isDir, isFile, perms, bytes}))
            await WaitForOk(client)
        }
        client.write('DONE')
        return new Promise((resolve, reject) => {
            client.end(() => resolve('Client closed'));
        });
    } catch (error) {
        console.error(error)
    }
}
