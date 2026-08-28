@echo off
setlocal
set EXE=C:\Users\Admin\AppData\Local\ms-playwright\chromium-1234\chrome-win64\chrome.exe
set URL=%~1
set OUT=%~2
set ERR=%~3
set PROF=%~4
set W=%~5
set H=%~6
set VT=%~7

if exist "%PROF%" rmdir /s /q "%PROF%"
"%EXE%" ^
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
  --virtual-time-budget=%VT% ^
  --dump-dom ^
  "%URL%" 1>"%OUT%" 2>"%ERR%"
echo exit=%ERRORLEVEL%