@echo off
echo ====================================================
echo IT School CRM Ecosystem - System Builder
echo ====================================================
echo.
echo Barcha loyihalar ishga tushirilmoqda...
echo.

echo 1. Backend Server (PORT: 5000)
cd backend
start "Backend" cmd /k "npm run start:dev"
cd ..

echo 2. Asosiy CRM (PORT: 3000) - Admin/Manager/Teacher
cd crm
start "CRM" cmd /k "npm run dev -- --port 3000"
cd ..

echo 3. Exam Platform (PORT: 3001) - Students UI
cd students
start "Exam Platform" cmd /k "npm run dev -- --port 3001"
cd ..

echo 4. Marketing Site (PORT: 3002) - itschool.uz
cd itschool
start "Marketing" cmd /k "npm run dev -- --port 3002"
cd ..

echo 5. IT Blog (PORT: 3003) - blog.itschool.uz
cd blog
start "Blog" cmd /k "npm run dev -- --port 3003"
cd ..

echo ====================================================
echo Xizmatlar ishga tushdi (Tizim bir necha soniyada yuklanadi)
echo.
echo 👉 CRM: http://localhost:3000
echo 👉 TBL: http://localhost:3001
echo 👉 LND: http://localhost:3002
echo 👉 BLG: http://localhost:3003
echo ====================================================
pause
