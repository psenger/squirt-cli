#!/bin/bash

while ! nc -z server 3000 3004 </dev/null; do
#while ! nc -z server 3000 || ! nc -z server 3001; do
    echo "Waiting for dependent services to be available..."
    sleep 5
done

exit 0
