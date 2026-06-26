@echo off
setlocal

cd /d "%~dp0"

echo Starting local preview server...

where python >nul 2>nul
if %errorlevel%==0 (
  echo Using Python http.server on http://localhost:5500/
  start "" "http://localhost:5500/"
  python -m http.server 5500
  goto :end
)

where py >nul 2>nul
if %errorlevel%==0 (
  echo Using py launcher http.server on http://localhost:5500/
  start "" "http://localhost:5500/"
  py -m http.server 5500
  goto :end
)

where node >nul 2>nul
if %errorlevel%==0 (
  echo Python not found, using npx serve on http://localhost:5500/
  start "" "http://localhost:5500/"
  npx --yes serve . -l 5500
  goto :end
)

echo.
echo No Python or Node runtime found.
echo Install Python or Node.js, then run this file again.
pause

:end
endlocal
