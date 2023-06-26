## Usage - `squirt-server.js` 🪓

The server is the receiver of the files and is the one that will be listening on a port for incoming connections.

```bash
npm install -g @psenger/squirt-cli
squirt-server
Enter the hostname (192.168.0.105):
Enter the http Port (3000):
Enter a Passphrase: Mr MonkeyGo Boom Boom when he EATS yellow Bannanaananans
Enter a Salt: Salted Peanuts taste good, but are not good for you!
Enter a Directory: /tmp/download/
Server listening on port http://192.168.0.105:3000/
```

Alternatively, you can simply copy and paste the code from `dist/squirt-server.js` into a file on your local machine and
run it.

## Usage - `squirt-client.js` 💣

The Client, is the sender of the files.

```bash
npm install -g @psenger/squirt-cli
squirt-client
Enter a http URL: http://192.168.0.105:3000/
Enter a Passphrase: Mr MonkeyGo Boom Boom when he EATS yellow Bannanaananans
Enter a Salt: Salted Peanuts taste good, but are not good for you!
Enter a Directory: /tmp/upload
```

Alternatively, you can simply copy and paste the code from `dist/squirt-client.js` into a file on your local machine and
run it.
