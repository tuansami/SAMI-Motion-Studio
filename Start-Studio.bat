@echo off
setlocal
title SAMI Motion Studio
cd /d "%~dp0"
chcp 65001 >nul

echo.
echo   ==========================================
echo      SAMI Motion Studio
echo   ==========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo   [LOI] Chua cai Node.js.
  echo   Tai ban LTS tai https://nodejs.org roi chay lai file nay.
  echo.
  pause
  exit /b 1
)

for /f "tokens=1 delims=." %%v in ('node -p "process.versions.node"') do set NODEMAJOR=%%v
if %NODEMAJOR% LSS 18 (
  echo   [LOI] Node.js qua cu. Can ban 18 tro len - hay cai ban LTS moi.
  pause
  exit /b 1
)

node server\check-deps.cjs
if errorlevel 1 (
  echo   Dang cai / cap nhat thu vien - lan dau mat 2-5 phut, can Internet...
  echo.
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo.
    echo   [LOI] Cai thu vien that bai. Kiem tra Internet roi chay lai.
    pause
    exit /b 1
  )
)

if exist "claude-code" if not exist ".claude" (
  xcopy /e /i /q "claude-code" ".claude" >nul
)

echo   Dang mo Studio tai http://localhost:5178
echo   GIU CUA SO NAY MO trong khi dung. Dong cua so = tat Studio.
echo.
node server/index.mjs
echo.
echo   Studio da dung.
pause
