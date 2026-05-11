@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title CRM Condominios - Inicializador
color 0A

echo.
echo ==================================================
echo          CRM CONDOMINIOS - INICIALIZADOR
echo.
echo    Este script inicia todo o ambiente local:
echo    [1] Docker (PostgreSQL + Redis)
echo    [2] Backend (NestJS - porta 3001)
echo    [3] Frontend (Next.js - porta 3000)
echo ==================================================
echo.

REM ============================================
REM [1/7] Verificar Docker Desktop
REM ============================================
echo [1/7] Verificando Docker Desktop...

docker version >nul 2>&1
if !errorlevel! neq 0 (
    echo    [ERRO] Docker Desktop NAO esta instalado ou nao esta no PATH!
    pause
    exit /b 1
)

REM --- Teste: docker ps (conexao basica) ---
set DOCKER_RETRIES=0

:loop_docker_ps
docker ps >nul 2>&1
if !errorlevel! equ 0 goto check_linux_engine

set /a DOCKER_RETRIES+=1
if !DOCKER_RETRIES! gtr 15 goto fail_docker

if !DOCKER_RETRIES! equ 1 (
    echo    Engine nao responde. Reiniciando WSL...
    wsl --shutdown >nul 2>&1
    timeout /t 3 /nobreak >nul
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe" >nul 2>&1
    echo    Aguardando Docker Desktop...
    timeout /t 10 /nobreak >nul
)

echo    Tentativa !DOCKER_RETRIES!/15...
timeout /t 3 /nobreak >nul
goto loop_docker_ps

REM --- Teste: Linux Engine funcional ---
:check_linux_engine
echo    Testando Linux Engine...

REM Capturar docker info em variavel (sem pipe que trava)
set DOCKER_LINUX=0
for /f "tokens=*" %%i in ('docker info 2^>nul ^| findstr /i "OSType"') do (
    echo %%i | findstr /i "linux" >nul 2>&1
    if !errorlevel! equ 0 set DOCKER_LINUX=1
)

if !DOCKER_LINUX! equ 1 goto linux_engine_ok

REM Linux engine nao detectado - tentar recuperar
echo    [AVISO] Linux Engine nao responde. Tentando recuperar...
echo    Reiniciando WSL2...
wsl --shutdown >nul 2>&1
timeout /t 3 /nobreak >nul

echo    Reiniciando Docker Desktop...
taskkill /IM "Docker Desktop.exe" /F >nul 2>&1
timeout /t 5 /nobreak >nul
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe" >nul 2>&1

echo    Aguardando Docker Desktop reconectar...
set LINUX_RETRIES=0

:loop_linux_engine
set /a LINUX_RETRIES+=1
if !LINUX_RETRIES! gtr 12 goto fail_docker

timeout /t 5 /nobreak >nul

set DOCKER_LINUX=0
for /f "tokens=*" %%i in ('docker info 2^>nul ^| findstr /i "OSType"') do (
    echo %%i | findstr /i "linux" >nul 2>&1
    if !errorlevel! equ 0 set DOCKER_LINUX=1
)

if !DOCKER_LINUX! equ 1 goto linux_engine_ok

echo    Tentativa !LINUX_RETRIES!/12 - aguardando Linux Engine...
goto loop_linux_engine

:linux_engine_ok
echo    [OK] Docker Engine respondendo (Linux mode).
goto docker_ok

:fail_docker
echo.
echo ==================================================
echo   ERRO: Docker Linux Engine nao responde!
echo.
echo   Solucoes (tente na ordem):
echo   1. Feche o Docker Desktop completamente
echo   2. PowerShell Admin: wsl --shutdown
echo   3. PowerShell Admin: wsl --update
echo   4. Reabra o Docker Desktop
echo   5. Settings - General - Use WSL2 (ativado)
echo   6. Execute este script novamente
echo ==================================================
echo.
pause
exit /b 1

:docker_ok

REM ============================================
REM [2/7] Liberar portas
REM ============================================
echo.
echo [2/7] Liberando portas 3000 e 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001" ^| findstr "LISTENING" 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING" 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo    [OK] Portas livres.

REM ============================================
REM Detectar Docker Compose
REM ============================================
set "COMPOSE_CMD="
docker compose version >nul 2>&1
if !errorlevel! equ 0 (
    set "COMPOSE_CMD=docker compose"
) else (
    docker-compose version >nul 2>&1
    if !errorlevel! equ 0 (
        set "COMPOSE_CMD=docker-compose"
    ) else (
        echo    [ERRO] Docker Compose nao encontrado!
        pause
        exit /b 1
    )
)
echo    Usando: !COMPOSE_CMD!

REM ============================================
REM [3/7] Subir containers
REM ============================================
echo.
echo [3/7] Subindo PostgreSQL e Redis...
cd /d "%~dp0"
!COMPOSE_CMD! up -d --remove-orphans postgres redis
if !errorlevel! neq 0 (
    echo    [ERRO] Falha ao subir containers Docker.
    echo    Verifique o Docker Desktop e tente novamente.
    pause
    exit /b 1
)
echo    [OK] PostgreSQL (5432) e Redis (6380) prontos.

REM ============================================
REM [4/7] Aguardar banco
REM ============================================
echo.
echo [4/7] Aguardando banco de dados ficar pronto...
set DB_RETRIES=0

:loop_wait_db
docker exec crm_postgres pg_isready -U crm_user >nul 2>&1
if !errorlevel! equ 0 goto db_ready

set /a DB_RETRIES+=1
if !DB_RETRIES! gtr 20 (
    echo    [ERRO] Banco nao ficou pronto em 20 tentativas.
    pause
    exit /b 1
)
echo    Tentativa !DB_RETRIES!/20 - aguardando...
timeout /t 2 /nobreak >nul
goto loop_wait_db

:db_ready
echo    [OK] PostgreSQL aceitando conexoes.

REM ============================================
REM [5/7] Preparar Backend
REM ============================================
echo.
echo [5/7] Preparando Backend...
cd /d "%~dp0backend"

if not exist "node_modules" (
    echo    Instalando dependencias do backend...
    call npm install
    if !errorlevel! neq 0 (
        echo    [ERRO] Falha ao instalar dependencias do backend.
        pause
        exit /b 1
    )
)

echo    Gerando cliente Prisma...
call npx prisma generate >nul 2>&1
if !errorlevel! neq 0 (
    echo    [AVISO] Falha ao gerar cliente Prisma.
)

echo    Sincronizando schema com o banco...
call npx prisma db push --accept-data-loss >nul 2>&1
if !errorlevel! neq 0 (
    echo    [AVISO] Falha ao sincronizar schema.
)

echo    Populando dados de exemplo (seed)...
call npx ts-node prisma/seed.ts >nul 2>&1
echo    [OK] Backend preparado.

REM ============================================
REM [6/7] Preparar Frontend
REM ============================================
echo.
echo [6/7] Preparando Frontend...
cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo    Instalando dependencias do frontend...
    call npm install
    if !errorlevel! neq 0 (
        echo    [ERRO] Falha ao instalar dependencias do frontend.
        pause
        exit /b 1
    )
)
echo    [OK] Frontend preparado.

REM ============================================
REM [7/7] Iniciar servidores
REM ============================================
echo.
echo [7/7] Iniciando servidores...

set BACKEND_DIR=%~dp0backend
set FRONTEND_DIR=%~dp0frontend

start "CRM-Backend" cmd /k "cd /d !BACKEND_DIR! & echo [BACKEND] Iniciando NestJS na porta 3001... & npm run start:dev"

echo    Aguardando backend subir (8s)...
timeout /t 8 /nobreak >nul

start "CRM-Frontend" cmd /k "cd /d !FRONTEND_DIR! & echo [FRONTEND] Iniciando Next.js na porta 3000... & npm run dev"

echo    Aguardando frontend subir (5s)...
timeout /t 5 /nobreak >nul

REM Abrir navegador
start "" http://localhost:3000/login

echo.
echo ==================================================
echo               TUDO PRONTO!
echo.
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:3001
echo   Swagger:   http://localhost:3001/api/docs
echo.
echo   -------- CREDENCIAIS DE TESTE --------
echo.
echo   Super Admin:
echo     Email:  admin@crmcondominios.com
echo     Senha:  Admin@123456
echo.
echo   Sindico:
echo     Email:  sindico@belavista.com
echo     Senha:  Sindico@123
echo.
echo   Atendente:
echo     Email:  portaria@belavista.com
echo     Senha:  Atendente@123
echo.
echo   Pressione qualquer tecla para PARAR TUDO.
echo ==================================================
echo.

pause >nul

REM ============================================
REM Encerrar tudo
REM ============================================
echo.
echo Encerrando servidores...
taskkill /FI "WINDOWTITLE eq CRM-Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq CRM-Frontend*" /T /F >nul 2>&1

echo Parando containers Docker...
cd /d "%~dp0"
!COMPOSE_CMD! stop postgres redis >nul 2>&1

echo.
echo [OK] Tudo encerrado com sucesso!
timeout /t 3 >nul

endlocal
