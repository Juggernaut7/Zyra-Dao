@echo off
echo ========================================
echo    Zyra Backend Installation Script
echo ========================================
echo.

echo [1/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Setting up environment...
if not exist .env (
    copy env.example .env
    echo Created .env file from template
    echo Please edit .env with your configuration
) else (
    echo .env file already exists
)

echo.
echo [3/4] Creating directories...
if not exist logs mkdir logs
if not exist uploads mkdir uploads
if not exist contracts\deployments mkdir contracts\deployments

echo.
echo [4/4] Installing smart contract dependencies...
cd contracts
call npm install
if %errorlevel% neq 0 (
    echo WARNING: Failed to install contract dependencies
    echo You can install them manually later
)
cd ..

echo.
echo ========================================
echo    Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Edit .env file with your configuration
echo 2. Set up MongoDB Atlas or local MongoDB
echo 3. Configure blockchain RPC URL (optional)
echo 4. Run: npm run dev
echo.
echo For detailed setup instructions, see README.md
echo.
pause
