#!/bin/bash

IPFS_PATH=$1
COMMIT=$2

export PATH=/usr/local/go/bin:$PATH

cd ${IPFS_PATH}
if [ ! -d go-ipfs/.git ]
then
  echo "> No git repo for go-ipfs, cloning..."
  git clone https://github.com/ipfs/go-ipfs.git 2>&1
  cd go-ipfs
else
  echo "> Git repo for js-ipfs found, updating..."
  cd go-ipfs
  git checkout master 2>&1
  git pull 2>&1
fi

if [ -z "$COMMIT" ]
then
  echo "> using MASTER"
else
  echo "> using commit: $COMMIT"
  git config --global advice.detachedHead false
  git checkout $COMMIT 2>&1
fi
echo "run make build for go-ipfs"
make build
