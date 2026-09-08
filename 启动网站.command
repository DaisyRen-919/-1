#!/bin/bash
cd "$(dirname "$0")"
if command -v python3 >/dev/null 2>&1; then
  python3 server.py
else
  echo "未找到 Python 3。您也可以直接双击 index.html 浏览网站。"
  read -r -p "按回车键退出……"
fi
