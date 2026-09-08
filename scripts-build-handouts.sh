#!/bin/sh
# Builds assets/lectures/<name>.pdf from handouts/<name>.html with headless Chrome, then re-embeds every PDF.
# KaTeX loads from cdnjs; set KATEX=/path/to/katex/dist to use a local copy (offline or behind a proxy).
set -e
CHROME=${CHROME:-$(command -v chromium || command -v chromium-browser || command -v google-chrome || echo "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")}
for f in handouts/*.html; do
  n=$(basename "$f" .html)
  dir=$(cd handouts && pwd)
  if [ -n "$KATEX" ]; then
    dir=$(mktemp -d)
    sed "s#https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9#file://$KATEX#g" "$f" > "$dir/$n.html"
    cp handouts/style.css "$dir/"
  fi
  "$CHROME" --headless --no-sandbox --disable-gpu --allow-file-access-from-files --virtual-time-budget=10000 \
    --no-pdf-header-footer --print-to-pdf="assets/lectures/$n.pdf" "file://$dir/$n.html"
done
sh scripts-embed-pdfs.sh
