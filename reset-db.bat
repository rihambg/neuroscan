@echo off
echo NeuroScan - Reset Database
echo ===========================
echo This will DELETE all data and re-apply seed data with correct passwords.
echo.
set /p confirm=Are you sure? Type YES to continue: 
if /i not "%confirm%"=="YES" (
    echo Cancelled.
    pause
    exit /b
)

echo.
echo [1/3] Stopping services (keeping postgres running)...
docker-compose stop auth-service business-service mri-service ai-service notification-service frontend

echo.
echo [2/3] Resetting database...
docker exec neuroscan-postgres psql -U neuroscan_user -d neuroscan -c "
  TRUNCATE notifications, event_logs, audit_logs, diagnoses, ai_analyses, mri_scans, link_requests, patients, doctors, users RESTART IDENTITY CASCADE;
"

echo [2b/3] Re-applying seed data...
docker exec -i neuroscan-postgres psql -U neuroscan_user -d neuroscan < database\migrations\002_seed_data.sql

echo.
echo [3/3] Restarting services...
docker-compose start auth-service business-service mri-service ai-service notification-service frontend

echo.
echo Done! Wait ~15 seconds then try logging in again.
echo Demo password for ALL accounts: Password123!
echo.
pause
