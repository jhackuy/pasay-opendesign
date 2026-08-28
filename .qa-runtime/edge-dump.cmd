@echo off
setlocal
set EXE=%1
set URL=%2
set OUT=%3
set PROF=%4
set WIDTH=%5
set HEIGHT=%6
set VT=%7

if exist "%PROF%" rmdir /s /q "%PROF%"
"%EXE%" ^
  --headless=new ^
  --no-sandbox ^
  --disable-gpu ^
  --no-first-run ^
  --mute-audio ^
  --hide-scrollbars ^
  --disable-dev-shm-usage ^
  --disable-background-networking ^
  --disable-extensions ^
  --user-data-dir="%PROF%" ^
  --window-size=%WIDTH%,%HEIGHT% ^
  --virtual-time-budget=%VT% ^
  --dump-dom ^
  "%URL%" 1>"%OUT%" 2>nul
echo exit=%ERRORLEVEL%