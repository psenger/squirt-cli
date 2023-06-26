#!/usr/bin/env node
"use strict";var e=require("cluster"),t=require("http"),s=require("path"),r=require("zlib"),n=require("fs"),o=require("crypto"),i=require("readline"),a=require("child_process"),c=require("os"),p=require("stream"),l=require("net"),d={};const u=i,{spawnSync:m}=a,y=n,f=c,{Transform:h}=p;d.prompt=async e=>{const t={};function s(e){return new Promise((async s=>{const{type:r,name:n,message:o,validate:i,filter:a,def:c}=e;async function p(e){if(i){const t=await i(e);if(!0!==t)return console.log(t),!1}return!0}function l(e){return a?a(e):e}!function e(){if("editor"===r)new Promise((e=>{const t=u.createInterface({input:process.stdin,output:process.stdout});t.question(`${o}`,(()=>{t.close(),e()}))})).then((async()=>{const r=`${y.mkdtempSync(`${f.tmpdir()}/`)}/${n}.tmp`,o=process.env.EDITOR||"vi";m(o,[r],{stdio:"inherit"});const i=y.readFileSync(r,"utf8");await p(i)?(t[n]=l(i),s(),y.unlinkSync(r)):e()}));else if("input"===r){const r=u.createInterface({input:process.stdin,output:process.stdout}),i=""+(c?` (${c}) `:" ");r.question(`${o}${i}:`,(async o=>{0===o.trim().length&&c&&(o=c);await p(o)?(t[n]=l(o),r.close(),s()):(r.close(),e())}))}else if("confirm"===r){const e=u.createInterface({input:process.stdin,output:process.stdout}),r=`${c?"(y)":"y"}/${c?"n":"(n)"}`;e.question(`${o} ${r}: `,(r=>{t[n]=!!(r||""+(c?"y":"n")).match(/^y(es)?$/i),e.close(),s()}))}else if("password"===r){const r=process.stdin,i=process.stdout;r.setRawMode(!0),r.resume(),i.write(`${o}: `);let a="";r.pipe(new h({encoding:"utf8",transform(e,t,s){const r="*".repeat(e.length);this.push(r),s()}})).pipe(i);const c=async o=>{if("\r"===o.toString()||"\n"===o.toString()){r.pause(),i.write("\n"),r.setRawMode(!1),r.removeListener("data",c);await p(a)?(t[n]=l(a),r.unpipe(),i.unpipe(),s()):(r.unpipe(),i.unpipe(),e())}else a+=o.toString()};r.on("data",c)}}()}))}return async function(){for(const t of e)await s(t);return t}()};var g={};const S=c,v=l;g.getIPAddress=()=>{const e=S.networkInterfaces();for(const t in e){const s=e[t];for(const e of s)if("IPv4"===e.family&&!e.internal)return e.address}return null},g.isPortFree=async(e,t="localhost")=>new Promise((s=>{const r=v.createServer();r.listen(e,t),r.on("listening",(()=>{r.close(),s(!0)})),r.on("error",(()=>{s(!1)}))}));var w={exports:{}};!function(e){const{join:t,normalize:r,dirname:o}=s,{readdirSync:i,statSync:a,lstatSync:c,mkdirSync:p,existsSync:l}=n,d=s,u=e=>(...t)=>!e(...t);e.exports.ifExist=e=>l(e),e.exports.ifNotExist=u(e.exports.ifExist),e.exports.isDirectory=e=>!!l(e)&&a(e).isDirectory(),e.exports.isNotDirectory=u(e.exports.isDirectory),e.exports.isFile=e=>!!l(e)&&a(e).isFile(),e.exports.isNotFile=u(e.exports.isFile),e.exports.buildStat=(s,r)=>{const n=a(t(s,r)),o=c(t(s,r));let i=e.exports.filePermissions(n),p=n.isFile();return{filePath:r,isDir:n.isDirectory(),isFile:p,isSymLink:o.isSymbolicLink(),perms:i,bytes:n.size,createdTime:n.birthtime,modifiedTime:n.mtime}},e.exports.ensurePathExists=function(t){try{const s=o(r(t));if(l(s))return;e.exports.ensurePathExists(s),p(s)}catch(e){}},e.exports.walkDirGen=async function*s(r,n){const o=i(d.join(r,n));for(const i of o){const{isDir:o,isFile:a,isSymLink:c,perms:p,bytes:l}=e.exports.buildStat(t(r,n),i);a?yield{filePath:d.join(n,i),isDir:o,isFile:a,perms:p,bytes:l}:o&&!c&&(yield*s(r,d.join(n,i)))}},e.exports.mkDirRecursivelySync=function(e){p(e,{recursive:!0})}}(w);var T=w.exports,x={};const{statSync:R,utimesSync:E,constants:I,chmodSync:P}=n;x.verifyBytes=(e,t)=>""+(R(t).size===e?"✅":"❌"),x.filePermissions=e=>({u:{r:!!(256&e.mode),w:!!(128&e.mode),x:!!(64&e.mode)},g:{r:!!(32&e.mode),w:!!(16&e.mode),x:!!(8&e.mode)},o:{r:!!(4&e.mode),w:!!(2&e.mode),x:!!(1&e.mode)}}),x.permissionsToFile=(e,t)=>{let s=0;e.u.r&&(s|=I.S_IRUSR),e.u.w&&(s|=I.S_IWUSR),e.u.x&&(s|=I.S_IXUSR),e.g.r&&(s|=I.S_IRGRP),e.g.w&&(s|=I.S_IWGRP),e.g.x&&(s|=I.S_IXGRP),e.o.r&&(s|=I.S_IROTH),e.o.w&&(s|=I.S_IWOTH),e.o.x&&(s|=I.S_IXOTH),P(t,s)},x.setTimeOnFile=(e,t,s)=>{E(s,new Date(e),new Date(t))};var $={};const b=o;$.encryptValue=(e,t,s,r=null,n="aes-256-ecb")=>{const o=b.scryptSync(t,s,32),i=b.createCipheriv(n,o,r,{});let a=i.update(e,"utf8","hex");return a+=i.final("hex"),a},$.decryptValue=(e,t,s,r=null,n="aes-256-ecb")=>{const o=b.scryptSync(t,s,32),i=b.createDecipheriv(n,o,r,{});let a=i.update(e,"hex","utf8");return a+=i.final("utf8"),a},$.genKey=(e,t,s=32)=>b.scryptSync(e,t,s);const O=e,A=t,{normalize:D,sep:N,join:k}=s,F=r,H=n,M=o,{prompt:q}=d,{getIPAddress:L,isPortFree:G}=g,{ifNotExist:B,isNotDirectory:C,ensurePathExists:_}=T,{permissionsToFile:U,setTimeOnFile:W,verifyBytes:Y}=x,{decryptValue:j,genKey:z}=$;["SIGHUP","SIGINT","SIGQUIT","SIGABRT","SIGTERM","SIGUSR2"].forEach((function(e){process.on(e,(function(){process.exit(0)}))}));const J=new Map;if(O.isMaster){const e=(e,t)=>{const n=O.fork(t);e.set(n.process.pid,[t,n,"FREE"]),n.on("message",s(n.process.pid)),n.on("exit",r(n.process.pid,e))},t=(e,t)=>{const[n]=t.get(e);t.delete(e);const o=O.fork(n);t.set(o.process.pid,[n,o,"FREE"]),o.on("message",s(o.process.pid)),o.on("exit",r(o.process.pid,t))},s=e=>({msg:t})=>{const[s,r]=J.get(e);J.set(e,[s,r,t])},r=(e,s)=>(r,n)=>{console.log(`worker ${e} died ${r} ${n}`),t(e,s)};(async()=>{const[,,...e]=process.argv;if(1===e.length&&"--headless"===e[0])return console.log("Running in headless mode"),{hostname:process.env.HOSTNAME,port:Number.parseInt(process.env.PORT.trim(),10),passphrase:process.env.PASSPHRASE,salt:process.env.SALT,directory:process.env.DIRECTORY,encryptionAlgorithm:process.env.ENCRYPTIONALGORITHM};const{hostname:t}=await q([{type:"input",name:"hostname",message:"Enter the external hostname or IP address",def:L(),validate:async e=>0!==(e||"").trim().length||"Try again, the hostname or IP address was not valid",filter:e=>e.trim()}]),{port:s}=await q([{type:"input",name:"port",message:"Enter the http Port",def:3e3,validate:async e=>0===(e||"").toString().trim().length?"Blank, invalid port value":e.toString().trim().match(/^\d+$/)?!1!==await G(Number.parseInt(e.toString().trim(),10),t)||`Port ${e.toString().trim()} is not available on ${t}, try again`:"Blank, invalid port value",filter:e=>Number.parseInt(e.toString().trim(),10)}]),{passphrase:r,salt:n,directory:o}=await q([{type:"password",name:"hostname",message:"Enter a Passphrase",validate:async e=>Buffer.byteLength(e,"utf8")>32||`Try again, the passphrase was only ${Buffer.byteLength(e,"utf8")} bytes and needs to be 32 Bytes`},{type:"password",name:"salt",message:"Enter a Salt",validate:async e=>Buffer.byteLength(e,"utf8")>16||`Try again, the salt was only ${Buffer.byteLength(e,"utf8")} bytes and needs to be 16 Bytes`},{type:"input",name:"directory",message:"Enter a directory",validate:async e=>B(e)?"Try again, the Directory does not exist.":!C(e)||`Try again, ${e} does not appear to be a Directory.`,filter:e=>D(e).endsWith(N)?e:D(k(e,N))}]);return{hostname:t,port:s,passphrase:r,salt:n,directory:o,encryptionAlgorithm:"aes-256-cbc"}})().then((({hostname:t,port:s,passphrase:r,salt:n,directory:o,encryptionAlgorithm:i})=>{const a=A.createServer(((e,s)=>{const r=Array.from(J.entries()).filter((([,[,,e]])=>"FREE"===e)).map((([,[e,,]])=>e.PORT)).map((e=>`http://${t}:${e}/`));if(0===r.length)return s.writeHead(503),void s.end("busy");const n=(o=r)[Math.floor(Math.random()*o.length)];var o;console.log(`dispatching worker to ${n}`),s.writeHead(302,{Location:n}),s.end()}));a.on("error",(e=>{throw e})),a.listen(s,(()=>{console.log(`Control server pid ${process.pid} started http://${t}:${s}/`);for(let a=1;a<=4;a++){e(J,{HOSTNAME:t,PORT:s+a,PASSPHRASE:r,SALT:n,DIRECTORY:o,ENCRYPTIONALGORITHM:i})}}))}))}else{const e=(e,t=500)=>{const s=new Error(e);throw s.httpMessage=e,s.httpStatusCode=t,s},t=function(t,s,r,n,o,i){console.log("Starting worker");const a=()=>c.listen(s,(()=>console.log(`Worker listening http://${t}:${s}/`))),c=A.createServer(((t,s)=>{console.log("incoming request to a worker");try{process.send({msg:"BUSY"});const a=t.headers.meta||e('Missing required "META" header',400),{filePath:c,perms:p,bytes:l,iv:d,createdTime:u,modifiedTime:m}=JSON.parse(j(a,r,n));_(k(o,c));t.pipe(F.createGunzip()).pipe(M.createDecipheriv(i,z(r,n),Buffer.from(d,"hex"),{})).pipe(H.createWriteStream(k(o,c))).on("finish",(()=>{U(p,k(o,c)),W(u,m,k(o,c)),console.log(`Received ${c} ${Y(l,k(o,c))}`),s.writeHead(200),s.end(JSON.stringify({message:"done"}))}))}catch(e){console.log(e),s.setHeader("Content-Type","application/json"),s.writeHead(e.httpStatusCode||500),s.end(JSON.stringify({error:e.httpMessage||e.message||"Error"}))}finally{process.send({msg:"FREE"})}}));c.on("error",(e=>{throw"EADDRINUSE"===e.code&&(console.log(`Worker address ${s} in use, retrying...`),setTimeout((()=>{c.close(),a()}),1e3)),e})),a()};t(process.env.HOSTNAME,process.env.PORT,process.env.PASSPHRASE,process.env.SALT,process.env.DIRECTORY,process.env.ENCRYPTIONALGORITHM)}module.exports={};
