const {networkInterfaces} = require("os")
const net = require('net')

const GetLocalIP = module.exports.GetLocalIP = function GetLocalIP() {
    const ifaces = networkInterfaces();
    let ipAddress;

    Object.keys(ifaces).forEach((ifname) => {
        ifaces[ifname].forEach((iface) => {
            if (iface.family === 'IPv4' && iface.internal === false) {
                ipAddress = iface.address;
            }
        });
    });

    return ipAddress;
}

const CreatClient = module.exports.CreatClient = async function CreatClient(connectOptions) {
    return new Promise((resolve, reject) => {
        const client = net.createConnection(connectOptions, () => {
            console.log(`Client connected to server on ${connectOptions.host}:${connectOptions.port}`);
            resolve(client);
        });
        client.on('error', (err) => {
            console.error(err);
            reject(err);
        });
    });
}

const CreatServer = module.exports.CreatServer = async function CreatServer(ConnectOptions, connectionListener) {
    return new Promise((resolve, reject) => {
        const server = net.createServer(connectionListener);
        resolve(server)
    });
}
const WaitForOk = module.exports.WaitForOk = async function WaitForOk(duplexStream) {
    return new Promise((resolve, reject) => {
        duplexStream.once('data', (data) => {
            const isOk = data.toString('utf8').trim()
            if (isOk === 'OK') {
                resolve()
            } else {
                reject()
            }
        })
    })
}
