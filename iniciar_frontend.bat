@echo off
title VeciRed IA Frontend (Web & Mobile)
echo ==============================================================================
echo             INICIANDO FRONTEND VECIRED IA (EXPO / REACT NATIVE)
echo ==============================================================================
cd /d "%~dp0"

if not exist node_modules (
    echo [1/2] Instalando paquetes de React Native y dependencias...
    call npm install
)

echo.
echo [2/2] Iniciando servidor Expo en http://localhost:8081 ...
echo.
echo  * Para abrir en el NAVEGADOR: Presiona la tecla 'w'
echo  * Para abrir en tu CELULAR: Escanea el codigo QR con la app Expo Go
echo.
call npx.cmd expo start -c
pause
