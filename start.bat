@echo off
REM NeuroScan - Windows Startup Script
REM Requirements: Docker Desktop must be running


echo.
echo  ================================================
echo  Brain MRI Consultation Platform - BRISC 2025
echo  ================================================
echo.

REM Check Docker
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo [1/3] Pulling base images...
docker-compose pull postgres rabbitmq consul traefik 2>nul

echo.
echo [2/3] Building services...
docker-compose build --parallel

echo.
echo [3/3] Starting all services...
docker-compose up -d

echo.
echo  Waiting for services to be ready...
timeout /t 15 /nobreak >nul

echo.
echo  ================================================
echo   NeuroScan is starting up!
echo  ================================================
echo.
echo   Frontend:          http://localhost
echo   API Gateway:       http://localhost/api
echo   Traefik Dashboard: http://localhost:8080
echo   RabbitMQ UI:       http://localhost:15672
echo   Consul UI:         http://localhost:8500
echo.
echo   Demo Doctor:   dr.martin@neuroscan.com  / Password123!
echo   Demo Patient:  patient.ali@mail.com     / Password123!
echo.
echo  ================================================
echo.

start http://localhost

pause
