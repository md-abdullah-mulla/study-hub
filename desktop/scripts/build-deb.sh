#!/bin/bash
#
# Builds the .deb by hand.
#
# Why not `electron-builder --linux deb`: it shells out to `fpm`, which calls
# `tar -I<app-builder>` and fails with "tar failed (exit code 2)" inside this
# container. The AppImage target (which is what most Linux students will use)
# builds fine, and a .deb is just a directory tree + a control file, so it is
# assembled here with dpkg-deb instead of pulling extra tooling.
#
# Usage:  bash scripts/build-deb.sh        (after npm run prepare-app)
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
unpacked="$here/release/linux-unpacked"
version="$(node -p "require('$here/package.json').version")"
out="$here/release/study-hub-desktop_${version}_amd64.deb"
stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT

[ -d "$unpacked" ] || { echo "[deb] run 'npm run pack' first (release/linux-unpacked missing)"; exit 1; }

mkdir -p "$stage/DEBIAN" "$stage/opt/Study Hub" "$stage/usr/share/applications" \
         "$stage/usr/share/icons/hicolor/1024x1024/apps" "$stage/usr/bin"

cp -a "$unpacked/." "$stage/opt/Study Hub/"
ln -sf "/opt/Study Hub/study-hub-desktop" "$stage/usr/bin/study-hub-desktop"
cp "$here/build/icon.png" "$stage/usr/share/icons/hicolor/1024x1024/apps/study-hub-desktop.png"

cat > "$stage/usr/share/applications/study-hub-desktop.desktop" <<'DESKTOP'
[Desktop Entry]
Name=Study Hub
Comment=Semester study manager — track, analyse, revise (offline)
Exec=study-hub-desktop %U
Terminal=false
Type=Application
Icon=study-hub-desktop
Categories=Education;Office;
StartupWMClass=Study Hub
DESKTOP

installed_size="$(du -sk "$stage/opt" | cut -f1)"
cat > "$stage/DEBIAN/control" <<CONTROL
Package: study-hub-desktop
Version: $version
Section: education
Priority: optional
Architecture: amd64
Maintainer: Md Abdullah Mulla <188435987+md-abdullah-mulla@users.noreply.github.com>
Homepage: https://study-hub-virid.vercel.app/
Description: Study Hub — Smart Semester Study Management System
 Diploma in CST, Semester 6 এর পড়াশোনা track, analyse ও revise করার
 offline desktop app. SQLite ওয়েব-অ্যাসেম্বলি ব্রাউজারে চলে, তাই
 ইন্টারনেট বা সার্ভার লাগে না।
Depends: libgtk-3-0, libnotify4, libnss3, libxss1, libxtst6, xdg-utils, libatspi2.0-0, libuuid1, libsecret-1-0
Installed-Size: $installed_size
CONTROL

dpkg-deb --build --root-owner-group "$stage" "$out" >/dev/null
echo "[deb] built → $out  ($(du -h "$out" | cut -f1))"
