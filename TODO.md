```
Error: EEXIST: file already exists, mkdir '/app/data/dir_5_0/dir_4_2/dir_3_0/dir_2_3'
    at mkdirSync (node:fs:1382:3)
    at Object.ensurePathExists (/app/dist/squirt-server.js:322:6)
    at ensurePathExists (/app/dist/squirt-server.js:321:21)
    at Server.<anonymous> (/app/dist/squirt-server.js:615:17)
    at Server.emit (node:events:513:28)
    at parserOnIncoming (node:_http_server:998:12)
    at HTTPParser.parserOnHeadersComplete (node:_http_common:128:17) {
  errno: -17,
  syscall: 'mkdir',
  code: 'EEXIST',
  path: '/app/data/dir_5_0/dir_4_2/dir_3_0/dir_2_3'
}
```

```
Skipping dir_5_2/dir_4_0/file_0.bin, did not match any GLOBs
Skipping dir_5_2/dir_4_0/dir_3_0/file_0.bin, did not match any GLOBs
Sending dir_5_2/dir_4_0/dir_3_0/file_1.bin
Sending dir_5_2/dir_4_0/dir_3_1/dir_2_0/dir_1_1/file_0.bin
Sending dir_5_2/dir_4_0/dir_3_1/dir_2_0/dir_1_1/file_1.bin
Sending dir_5_2/dir_4_0/dir_3_1/dir_2_0/dir_1_1/file_2.bin
```
