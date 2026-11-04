@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ================================================
echo   ROSSANO AVENTURA FICHIS - SERVIDOR ONLINE
echo ================================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao esta instalado ou nao esta disponivel no PATH.
  echo Instala Node.js LTS a partir do site oficial: https://nodejs.org/
  echo Depois fecha e abre esta janela e executa este ficheiro novamente.
  pause
  exit /b 1
)
if not exist node_modules\ws (
  echo A preparar a dependencia segura do servidor (ws)...
  call npm install --omit=dev
  if errorlevel 1 (
    echo A instalacao falhou. Verifica a internet e consulta a mensagem acima.
    pause
    exit /b 1
  )
)
echo.
set MAX_TOTAL_PLAYERS=500
set MAX_PLAYERS_PER_ROOM=50
echo Limite inicial configurado: 500 ligacoes por servidor e 50 por sala.
echo Quando aparecer a mensagem de servidor ativo, abre http://localhost:3000
echo Para parar o servidor, volta a esta janela e carrega CTRL+C.
echo.
node server.js
pause
