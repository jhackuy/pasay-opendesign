@echo off
setlocal
set EXE=C:\Users\Admin\AppData\Local\ms-playwright\chromium-1234\chrome-win64\chrome.exe
set URL=%~1
set PROF=%~2
set PORT=%~3
set W=%~4
set H=%~5

if exist "%PROF%" rmdir /s /q "%PROF%"
start "bqa-chrome-%PORT%" /B "%EXE%" ^
  --headless=new ^
  --no-sandbox ^
  --disable-gpu ^
  --disable-software-rasterizer ^
  --no-first-run ^
  --mute-audio ^
  --hide-scrollbars ^
  --disable-dev-shm-usage ^
  --disable-background-networking ^
  --disable-extensions ^
  --disable-component-update ^
  --disable-breakpad ^
  --disable-features=Crashpad,MojoIpcz,VizDisplayCompositor ^
  --user-data-dir="%PROF%" ^
  --window-size=%W%,%H% ^
  --remote-debugging-port=%PORT% ^
  --remote-allow-origins=* ^
  --no-default-browser-check ^
  about:blank
echo launched