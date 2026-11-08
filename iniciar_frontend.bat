@echo off
title VeciRed IA Frontend (Web & Mobile)
echo ==============================================================================
echo             INICIANDO FRONTEND VECIRED IA (EXPO / REACT NATIVE)
echo ==============================================================================
echo Limpiando cache e iniciando servidor en http://localhost:8081 ...
echo.
echo  * Para abrir en el NAVEGADOR: Presiona la tecla 'w'
echo  * Para abrir en tu CELULAR: Escanea el codigo QR con la app Expo Go
echo.
cd /d "%~dp0"
call npx.cmd expo start -c
pause
