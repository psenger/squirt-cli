const os = require('os'),
        net = require('net');
/**
 * Get the IP address
 * @return {null|string}
 */
module.exports.getIPAddress = () => {
    const interfaces = os.networkInterfaces();
    for (const interfaceName in interfaces) {
        const interfaceInfo = interfaces[interfaceName];
        for (const iFace of interfaceInfo) {
            if (iFace.family === 'IPv4' && !iFace.internal) {
                return iFace.address;
            }
        }
    }
    return null;
}
/**
 * Is the port free
 * @param port
 * @param hostname
 * @return {Promise<unknown>}
 */
module.exports.isPortFree = async (port, hostname = 'localhost') => {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.listen(port, hostname);
        server.on('listening', () => {
            server.close();
            resolve(true);
        });
        server.on('error', () => {
            resolve(false);
        });
    });
}
