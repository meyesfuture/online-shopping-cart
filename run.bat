@echo off
title Campus Cart - Server
cd /d "%~dp0"

echo ========================================================
echo       Starting Campus Cart (Spring Boot + MySQL)
echo ========================================================

:: Check if MySQL is running on port 3306
netstat -ano | findstr :3306 >nul 2>&1
if %errorlevel% neq 0 (
    if exist "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" (
        echo [1/3] Starting local MySQL Server...
        start /b "" "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --no-defaults --datadir="%USERPROFILE%\mysql_data" --port=3306
        timeout /t 2 /nobreak >nul
    ) else (
        echo [!] Notice: MySQL is not detected on port 3306.
        echo Please ensure MySQL is running with database.sql imported.
    )
) else (
    echo [1/3] MySQL Server is running on port 3306.
)

:: Check if application.properties exists, copy example if not
if not exist "src\main\resources\application.properties" (
    echo [2/3] Setting up application.properties from example...
    copy "src\main\resources\application.properties.example" "src\main\resources\application.properties" >nul
)

:: Build jar if not built
if not exist "target\online-shopping-cart-1.0.0.jar" (
    echo [2/3] Building application with Maven Wrapper...
    call mvnw.cmd package -DskipTests
)

:: Check if port 8080 is already active
netstat -ano | findstr :8080 >nul 2>&1
if %errorlevel% equ 0 (
    echo Spring Boot is already running on port 8080.
    start http://localhost:8080
    exit /b 0
)

echo Starting Spring Boot application on port 8080...
start http://localhost:8080
java -jar target\online-shopping-cart-1.0.0.jar
pause
