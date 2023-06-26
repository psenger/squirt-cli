
## Design 🛠️

```mermaid
sequenceDiagram
    walkDir ->>+ Client: get directory contents or recurse
    walkDir ->>+ Client: isMatch / test GLOB
    walkDir ->>+ Client: dryRun
    walkDir ->>+ Client: Do permissions permit Read
    Note over walkDir, Client: Build Encrypted Header
    Client ->>+ Server-Controller: Get free worker
    Server-Controller ->>+ Server-Controller: take the next free Worker, or return http 503
    Server-Controller ->>+ Client: Location to a free worker http 302
    Client ->>+ Server-Worker: Send header ( with IV per request ) via http.request Post
    Client ->>+ Server-Worker: http.request Stream Body
    Client ->>- walkDir: Next File / Directory
```

## Encryption 🔑

You might wonder why this uses Symmetric Encryption vs Asymmetric, and that is to reduce the complexity of key exchange
and the need for a certificate authority. The encryption algorithm is aes-256-cbc, which requires an IV ( initialization
vector ), a Key, and Passphrase.

The header does not use an IV rather, it is a blank... but per request a random size and value Nonce is injected into
front of every payload ( effectively behaving like an IV ). The IV that is attached to the cipher payload in the header
is intended for the body... SO, at this point you might get excited and say "WHY WOULD YOU DO THIS!"

Let me explain, since it is possible to Man-in-the-middle a CBC without an IV, the Nonce in the header will deter an
attack as it is different every request, and a new IV ( intended for the body ) is generated per request and is attached
to the header payload because it is possible that the body may contain repeating content. Furthermore, capturing the
header and decrypting it, will reduce the surface of the attack only to the one request. The next request will have a
different Nonce and IV.
