# Campus Cart Start Script
Set-Location -Path $PSScriptRoot

Write-Host "========================================================" -ForegroundColor Green
Write-Host "      Starting Campus Cart (Spring Boot + MySQL)" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

# 1. Check MySQL
$mysqlActive = Get-NetTCPConnection -LocalPort 3306 -State Listen -ErrorAction SilentlyContinue
if (-not $mysqlActive) {
    if (Test-Path "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe") {
        Write-Host "[1/3] Starting local MySQL server..." -ForegroundColor Yellow
        Start-Process -FilePath "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" `
                      -ArgumentList "--no-defaults --datadir=$HOME/mysql_data --port=3306" `
                      -WindowStyle Hidden
        Start-Sleep -Seconds 2
    } else {
        Write-Host "[!] Notice: MySQL is not detected on port 3306. Please ensure MySQL is running." -ForegroundColor DarkYellow
    }
} else {
    Write-Host "[1/3] MySQL server is running on port 3306." -ForegroundColor Cyan
}

# 2. Check application.properties
if (-not (Test-Path "src/main/resources/application.properties")) {
    Copy-Item "src/main/resources/application.properties.example" "src/main/resources/application.properties"
}

# 3. Build if needed
if (-not (Test-Path "target/online-shopping-cart-1.0.0.jar")) {
    Write-Host "[2/3] Building application jar..." -ForegroundColor Yellow
    & ".\mvnw.cmd" package -DskipTests
}

# 4. Check Spring Boot port 8080
$appActive = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if ($appActive) {
    Write-Host "[2/3] Spring Boot is already running on port 8080." -ForegroundColor Cyan
    Write-Host "[3/3] Opening browser at http://localhost:8080 ..." -ForegroundColor Green
    Start-Process "http://localhost:8080"
    Write-Host "Ready! Visit http://localhost:8080" -ForegroundColor Green
    exit 0
}

Write-Host "[2/3] Opening browser at http://localhost:8080 ..." -ForegroundColor Green
Start-Process "http://localhost:8080"

Write-Host "[3/3] Starting Spring Boot application..." -ForegroundColor Yellow
java -jar target\online-shopping-cart-1.0.0.jar
