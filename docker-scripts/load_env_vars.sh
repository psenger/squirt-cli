#!/bin/bash
source /app/docker-shared/env_vars
echo $PASSPHRASE
echo $SALT
echo $HOSTNAME
echo $SERVERURL
echo $PORT
echo $DIRECTORY
echo $ENCRYPTIONALGORITHM
echo $FILE_DEPTH
echo $DRYRUN
echo $GLOBPATTERNS
exec "$@"
