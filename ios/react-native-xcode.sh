#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Bundle React Native app's code and image assets.
# This script is supposed to be invoked as part of Xcode build process
# and relies on environment variables (including PWD) set by Xcode

# Print commands before executing them (useful for troubleshooting)
set -x
DEST=$CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH

# Enables iOS devices to get the IP address of the machine running Metro
if [[ "$CONFIGURATION" = *Debug* && ! "$PLATFORM_NAME" == *simulator ]]; then
  IP=$(ipconfig getifaddr en0)
  if [[ -z "$IP" || -n "`ifconfig $value | grep 'baseT'`" ]]; then
    IP=$(ipconfig getifaddr en1)
  fi
  if [ -z "$IP" ]; then
    IP=$(ifconfig | grep 'inet ' | grep -v ' 127.' | grep -v ' 169.254.' |cut -d\   -f2  | awk 'NR==1{print $1}')
  fi

  echo "$IP" > "$DEST/ip.txt"
fi

if [[ "$SKIP_BUNDLING" ]]; then
  echo "SKIP_BUNDLING enabled; skipping."
  exit 0;
fi

case "$CONFIGURATION" in
  *Debug*)
    if [[ "$PLATFORM_NAME" == *simulator ]]; then
      if [[ "$FORCE_BUNDLING" ]]; then
        echo "FORCE_BUNDLING enabled; continuing to bundle."
      else
        echo "Skipping bundling in Debug for the Simulator (since the packager bundles for you). Use the FORCE_BUNDLING flag to change this behavior."
        exit 0;
      fi
    else
      echo "Bundling for physical device. Use the SKIP_BUNDLING flag to change this behavior."
    fi

    DEV=true
    ;;
  "")
    echo "$0 must be invoked by Xcode"
    exit 1
    ;;
  *)
    DEV=false
    ;;
esac

# Setting up a project root was a workaround to enable support for non-standard
# structures, including monorepos. Today, CLI supports that out of the box
# and setting custom `PROJECT_ROOT` only makes it confusing. 
#
# As a backwards-compatible change, I am leaving "PROJECT_ROOT" support for those
# who already use it - it is likely a non-breaking removal.
#
# For new users, we default to $PWD - not changing things all.
#
# For context: https://github.com/facebook/react-native/commit/9ccde378b6e6379df61f9d968be6346ca6be7ead#commitcomment-37914902
PROJECT_ROOT=${PROJECT_ROOT:-$PWD}
cd "$PROJECT_ROOT/.." || exit

# Define entry file
if [[ "$ENTRY_FILE" ]]; then
  # Use ENTRY_FILE defined by user
  :
elif [[ -s "index.ios.js" ]]; then
   ENTRY_FILE=${1:-index.ios.js}
 else
   ENTRY_FILE=${1:-index.js}
fi

# Path to react-native folder inside node_modules
REACT_NATIVE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/node_modules/react-native" && pwd)"
# check and assign NODE_BINARY env
# shellcheck source=/dev/null
source "$REACT_NATIVE_DIR/scripts/node-binary.sh"

[ -z "$NODE_ARGS" ] && export NODE_ARGS=""

[ -z "$CLI_PATH" ] && export CLI_PATH="$REACT_NATIVE_DIR/cli.js"

[ -z "$BUNDLE_COMMAND" ] && BUNDLE_COMMAND="bundle"

if [[ -z "$BUNDLE_CONFIG" ]]; then
  CONFIG_ARG=""
else
  CONFIG_ARG="--config $BUNDLE_CONFIG"
fi

BUNDLE_FILE="$DEST/main.jsbundle"

"$NODE_BINARY" $NODE_ARGS "$CLI_PATH" $BUNDLE_COMMAND \
  $CONFIG_ARG \
  --entry-file "$ENTRY_FILE" \
  --platform ios \
  --dev $DEV \
  --reset-cache \
  --bundle-output "$BUNDLE_FILE" \
  --assets-dest "$DEST" \
  $EXTRA_PACKAGER_ARGS

if [[ $DEV != true && ! -f "$BUNDLE_FILE" ]]; then
  echo "error: File $BUNDLE_FILE does not exist. This must be a bug with" >&2
  echo "React Native, please report it here: https://github.com/facebook/react-native/issues"
  exit 2
fi

