#!/bin/bash

IPFS_PATH=$1
COMMIT=$2

cd ${IPFS_PATH}
if [ ! -d js-ipfs/.git ]
then
  echo "> No git repo for js-ipfs, cloning..."
  git clone https://github.com/ipfs/js-ipfs.git 2>&1
  cd js-ipfs
else
  echo "> Git repo for js-ipfs found, updating..."
  cd js-ipfs
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
echo "run npm install for js-ipfs"
source ~/.nvm/nvm.sh
npm install --loglevel=error