@echo off
setlocal
title Azuska Z - mise a jour
cd /d "%~dp0"

echo.
echo   ========================================
echo      A Z U S K A   Z   -   mise a jour
echo   ========================================

where node >nul 2>nul
if errorlevel 1 goto pas_de_node

rem  %1 permet de glisser le zip telecharge directement sur ce fichier.
rem  Sans rien glisser, le zip le plus recent est cherche dans Telechargements.
node "scripts\mettre-a-jour.mjs" %1
if errorlevel 1 goto echec

echo.
pause
exit /b 0

:pas_de_node
echo.
echo   Node.js n'est pas installe sur cet ordinateur.
echo   Va sur https://nodejs.org, installe la version LTS, puis relance.
echo.
pause
exit /b 1

:echec
echo.
echo   La mise a jour ne s'est pas faite. Ton dossier n'a pas ete modifie.
echo   Lis le message ci-dessus.
echo.
pause
exit /b 1
