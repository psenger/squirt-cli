const {CreatServer,GetLocalIP} = require('./lib/net')

const ConnectOptions = { host: GetLocalIP(), port: 8000 }
const run = async () => {
    const server = await CreatServer(ConnectOptions, (connection) => {
        const flowOne = (data) => {
            console.log('Received data from client');
            const message = data.toString().trim();
            if (message === 'JSON') {
                console.log('Client is sending JSON data');
                // Send a confirmation to the client
                connection.write('OK');
                // Listen for the JSON object from the client
                connection.once('data', (data) => {
                    const json = JSON.parse(data.toString().trim());
                    console.log('Received JSON object:', json);
                    connection.write('OK');
                    connection.once('data', flowOne);
                });
            } else if (message === 'DONE') {
                server.close()
            } else {
                console.log('Unknown message:', message);
            }

        }
        connection.once('data', flowOne);
    })
    return new Promise((resolve, reject) => {
        server.listen(ConnectOptions, () => {
            console.log(`Server listening on ${ConnectOptions.host}:${ConnectOptions.port}`);
        });
        server.on('close', () => {
            resolve('Server closed');
        })
        server.on('error', (err) => {
            console.error(err);
            reject(err);
        })
    })
}

run().then(console.log).catch(console.error)
