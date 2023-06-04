# squirt

> yet another peer to peer encrypted file transfer utilizing native NodeJS Streams, Crypto, and HTTP for the most effective and stealth operation

**note** this has not been tested on anything other than MacOS with Node 16.

## Design

* `server.js` accepts files
* `client.js` sends files

## Usage - server.js

```bash
./server.js
Enter the hostname (192.168.0.105):
Enter the http Port (3000):
Enter a Passphrase: Mr MonkeyGo Boom Boom when he EATS yellow Bannanaananans
Enter a Salt: Salted Peanuts taste good, but are not good for you!
Enter a Directory: /tmp/download/
Server listening on port http://192.168.0.105:3000/
```
## Usage - client.js

```bash
./client.js
Enter a http URL: http://192.168.0.105:3000/
Enter a Passphrase: Mr MonkeyGo Boom Boom when he EATS yellow Bannanaananans
Enter a Salt: Salted Peanuts taste good, but are not good for you!
Enter a Directory: /tmp/upload
```
