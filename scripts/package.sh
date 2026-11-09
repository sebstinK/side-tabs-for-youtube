#!/usr/bin/env bash
# Builds the ZIP for the Chrome Web Store: dist/side-tabs-for-youtube-<version>.zip
# Only the files the extension needs at runtime go into the package.
set -euo pipefail

cd "$(dirname "$0")/.."

VERSION=$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' manifest.json | head -n 1)
if [ -z "$VERSION" ]; then
  echo "Could not read version from manifest.json" >&2
  exit 1
fi

NAME="side-tabs-for-youtube-$VERSION"
mkdir -p dist
rm -f "dist/$NAME.zip"

zip -r -X -q "dist/$NAME.zip" \
  manifest.json \
  src \
  icons \
  _locales \
  LICENSE \
  -x '*.DS_Store'

echo "Built dist/$NAME.zip"
unzip -l "dist/$NAME.zip"
