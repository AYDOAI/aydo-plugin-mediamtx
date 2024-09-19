#!/bin/bash

ARCHIVE="../aydo_plugin_mediamtx_$1.zip"

rm -r -f ./release
mkdir -p ./release
mkdir -p ./release/plugins

cp ./setup ./release/plugins

cd ./release
rm "$ARCHIVE"
zip -u -r -q "$ARCHIVE" ./plugins

if [ "$2" != "" ]; then
  echo "Copy to server: $2"
  scp "$ARCHIVE" "$2"
fi
