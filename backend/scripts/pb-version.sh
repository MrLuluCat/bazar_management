# Sourced by the other scripts. Pinned PocketBase version + downloader.
PB_VERSION="0.40.4"

case "$(uname -s)" in
  Linux*) PB_OS=linux; PB_BIN=pocketbase ;;
  Darwin*) PB_OS=darwin; PB_BIN=pocketbase ;;
  MINGW*|MSYS*|CYGWIN*) PB_OS=windows; PB_BIN=pocketbase.exe ;;
  *) echo "OS tidak didukung" >&2; exit 1 ;;
esac
case "$(uname -m)" in
  arm64|aarch64) PB_ARCH=arm64 ;;
  *) PB_ARCH=amd64 ;;
esac

# Downloads the PocketBase binary into the backend folder if it is missing.
ensure_pocketbase() {
  if [ -x "./$PB_BIN" ]; then return; fi
  echo "==> download PocketBase $PB_VERSION ($PB_OS/$PB_ARCH)"
  curl -fsSL -o pb.zip "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_${PB_OS}_${PB_ARCH}.zip"
  unzip -oq pb.zip "$PB_BIN"
  rm pb.zip
  chmod +x "$PB_BIN"
}
