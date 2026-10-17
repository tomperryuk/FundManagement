#!/bin/sh
set -eu
# Fly mounts the encrypted volume as root. Grant only the app user access to
# its data directory, then drop privileges before running the HTTP server.
mkdir -p /data/decisions
chown node:node /data/decisions
chmod 700 /data/decisions
exec su node -s /bin/sh -c 'exec node server.mjs'
