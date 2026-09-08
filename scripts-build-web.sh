#!/bin/sh
# Exports the web build and folds it into one self-contained HTML file (dist/ml-notes.html) for publishing.
set -e
npx expo export --platform web --output-dir dist >/dev/null
js=$(ls dist/_expo/static/js/web/index-*.js | head -1)
out=dist/ml-notes.html
{
  printf '<title>Interactive ML Notes</title>\n'
  printf '<style>html,body{height:100%%;margin:0;background:#fff}body{overflow:hidden}#root{display:flex;height:100%%;flex:1}</style>\n'
  printf '<div id="root"></div>\n<script>'
  # In an inline script the HTML parser treats "<!--" as the start of an escaped section, after which the closing
  # script tag is ignored and the bundle never runs. Escape it; "\!" is a plain "!" in JS strings and regexes.
  sed 's/<!--/<\\!--/g' "$js"
  printf '</script>\n'
} > "$out"
grep -c '</script>' "$out" | sed 's/^/closing script tags (expect 1): /'
ls -la "$out"
