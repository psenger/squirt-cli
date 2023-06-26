#!/bin/bash -x
PASSPHRASE=$(openssl rand -hex 32)
SALT=$(openssl rand -hex 16)
{
export PASSPHRASE=$PASSPHRASE
export SALT=$SALT
export SERVERURL=http://server:3000/
export PORT=3000
export HOSTNAME=$HOSTNAME
export DIRECTORY=/app/data
export ENCRYPTIONALGORITHM=aes-256-cbc
export FILE_DEPTH=3
export DRYRUN=false
export GLOBPATTERNS=
} >> /app/docker/shared/env_vars
mkdir /app/data
exec "$@"
