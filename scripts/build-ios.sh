#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

npm run build

if [ ! -d "ios" ]; then
  npx cap add ios
fi

npx cap sync ios
cp ios-host/Info.plist ios/App/App/Info.plist 2>/dev/null || true

echo "iOS Capacitor project synced at: $ROOT_DIR/ios"
echo "Open in Xcode to run on iPhone Simulator or physical iPhone: npx cap open ios"
