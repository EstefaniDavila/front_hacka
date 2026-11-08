@echo off
title VeciRed IA Frontend (Modo Tunnel 5G / Celular)
echo ==============================================================================
echo       INICIANDO FRONTEND EN MODO TUNNEL (PARA CELULAR CON DATOS / 5G / WI-FI)
echo ==============================================================================
echo Creando tunel seguro para conectar cualquier celular sin bloqueos...
echo.
cd /d "%~dp0"
call npx.cmd expo start --tunnel -c
pause
