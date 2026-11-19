#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_NAME="T-English"
DIST_MACOS="$ROOT_DIR/dist-macos"
APP_BUNDLE="$DIST_MACOS/$APP_NAME.app"

if [ ! -d "$ROOT_DIR/dist" ]; then
  echo "Building Vite production bundle first..."
  (cd "$ROOT_DIR" && npm run build)
fi

rm -rf "$APP_BUNDLE"
mkdir -p "$APP_BUNDLE/Contents/MacOS"
mkdir -p "$APP_BUNDLE/Contents/Resources/web"

if [ ! -f "$ROOT_DIR/macos-host/AppIcon.icns" ] && command -v python3 >/dev/null 2>&1; then
  python3 "$ROOT_DIR/macos-host/generate-icons.py"
fi

if [ -f "$ROOT_DIR/macos-host/AppIcon.icns" ]; then
  cp "$ROOT_DIR/macos-host/AppIcon.icns" "$APP_BUNDLE/Contents/Resources/AppIcon.icns"
fi

cp "$ROOT_DIR/macos-host/Info.plist" "$APP_BUNDLE/Contents/Info.plist"
cp -R "$ROOT_DIR/dist/"* "$APP_BUNDLE/Contents/Resources/web/"

clang++ \
  -std=c++17 \
  -ObjC++ \
  -fobjc-arc \
  -O2 \
  -framework Cocoa \
  -framework WebKit \
  "$ROOT_DIR/macos-host/TEnglishApp.mm" \
  -o "$APP_BUNDLE/Contents/MacOS/$APP_NAME"

codesign --force --deep --sign - "$APP_BUNDLE" >/dev/null 2>&1 || true

echo "Built macOS app bundle at: $APP_BUNDLE"

LSREGISTER="/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"
if [ -x "$LSREGISTER" ]; then
  "$LSREGISTER" -f -r "$APP_BUNDLE" >/dev/null 2>&1 || true
fi

if [ -w "/Applications" ]; then
  rm -rf "/Applications/$APP_NAME.app"
  cp -R "$APP_BUNDLE" "/Applications/$APP_NAME.app"
  touch "/Applications/$APP_NAME.app"
  if [ -x "$LSREGISTER" ]; then
    "$LSREGISTER" -f -r "/Applications/$APP_NAME.app" >/dev/null 2>&1 || true
  fi
  qlmanage -r cache >/dev/null 2>&1 || true
  killall Dock >/dev/null 2>&1 || true
  echo "Installed to: /Applications/$APP_NAME.app"
else
  mkdir -p "$HOME/Applications"
  rm -rf "$HOME/Applications/$APP_NAME.app"
  cp -R "$APP_BUNDLE" "$HOME/Applications/$APP_NAME.app"
  touch "$HOME/Applications/$APP_NAME.app"
  if [ -x "$LSREGISTER" ]; then
    "$LSREGISTER" -f -r "$HOME/Applications/$APP_NAME.app" >/dev/null 2>&1 || true
  fi
  qlmanage -r cache >/dev/null 2>&1 || true
  killall Dock >/dev/null 2>&1 || true
  echo "Installed to: $HOME/Applications/$APP_NAME.app"
fi
