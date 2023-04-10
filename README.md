# squirt

> yet another peer to peer encrypted file transfer utilizing NodeJS Streams for the the most effective and stealth
> operation

## Flow

```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant FS

    Client ->> Server: Connect
    Server ->> Server: Set up Duplex stream
    Client ->> Server: JSON
    Server ->> Server: Send OK
    activate FS
    Client ->> FS: readdirSync
    Client ->> FS: stat
    FS -->> Client: {"stat": ..., "path": "/path/to/example.txt"}
    deactivate FS
    Client ->> Server: {"stat": ..., "name": "example.txt", "hash": "abcd1234", "path": "/path/to/example.txt"}
    Server ->> Server: Parse JSON object
    Server ->> Server: Send OK
    Client ->> Server: FILE
    Server ->> Server: Send OK
    Client ->> Server: Confirm READY
    Server ->> Server: Read file
    Server ->> Server: Send file data
    Server ->> Server: File sent
```
