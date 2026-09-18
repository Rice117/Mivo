@echo off
setlocal
title Azuska Z
cd /d "%~dp0"

echo.
echo   ========================================
echo      A Z U S K A   Z
echo   ========================================
echo.

where node >nul 2>nul
if errorlevel 1 goto pas_de_node

echo   Verification du projet...
node "scripts\reparer-package-json.mjs"
if errorlevel 1 goto echec

cd frontend

if not exist "node_modules" goto installer
goto demarrer

:installer
echo.
echo   Premier demarrage : installation des composants.
echo   Cela prend quelques minutes et demande une connexion internet.
echo   Les fois suivantes, ce sera immediat.
echo.
call npm install
if errorlevel 1 goto echec_installation
echo.
echo   Installation terminee.

:demarrer
echo.
echo   L'application demarre.
echo   Ton navigateur va s'ouvrir tout seul dans quelques secondes.
echo   Si ce n'est pas le cas, ouvre cette adresse :
echo.
echo       http://localhost:3000
echo.
echo   Pour arreter l'application : ferme cette fenetre noire.
echo.
start "Azuska Z" cmd /c "timeout /t 12 /nobreak >nul && start http://localhost:3000"
call npm run dev
goto fin

:pas_de_node
echo   Node.js n'est pas installe sur cet ordinateur.
echo.
echo   1. Va sur   https://nodejs.org
echo   2. Telecharge la version marquee LTS
echo   3. Installe-la en cliquant Suivant jusqu'au bout
echo   4. Relance ce fichier
echo.
pause
exit /b 1

:echec_installation
echo.
echo   L'installation n'a pas abouti.
echo   Verifie ta connexion internet, puis relance ce fichier.
echo.
pause
exit /b 1

:echec
echo.
echo   Le demarrage s'est arrete. Lis le message ci-dessus.
echo.
pause
exit /b 1

:fin
echo.
echo   L'application est arretee.
echo.
pause
