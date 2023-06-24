#!/bin/bash -x
PASSPHRASE=$(openssl rand -hex 32)
SALT=$(openssl rand -hex 16)
echo "export PASSPHRASE=$PASSPHRASE" > /app/docker-shared/env_vars
echo "export SALT=$SALT" >> /app/docker-shared/env_vars
echo "export SERVERURL=http://server:3000/" >> /app/docker-shared/env_vars
echo "export PORT=3000" >> /app/docker-shared/env_vars
echo "export HOSTNAME=$HOSTNAME" >> /app/docker-shared/env_vars
echo "export DIRECTORY=/app/data" >> /app/docker-shared/env_vars
echo "export ENCRYPTIONALGORITHM=aes-256-cbc" >> /app/docker-shared/env_vars
echo "export FILE_DEPTH=3" >> /app/docker-shared/env_vars
echo "export DRYRUN=false" >> /app/docker-shared/env_vars
echo "export GLOBPATTERNS=" >> /app/docker-shared/env_vars
mkdir /app/data
exec "$@"
