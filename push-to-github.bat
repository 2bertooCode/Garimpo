@echo off
title Enviando Morning Brew para o GitHub
color 0b
echo ====================================================================
echo             MORNING BREW - ENVIAR PROJETO PARA O GITHUB
echo ====================================================================
echo.
echo   Destino: https://github.com/2bertooCode/Garimpo.git
echo.
echo   Preparando para enviar todos os arquivos...
echo.
git push -u origin main
echo.
echo ====================================================================
echo   Processo Finalizado!
echo   Verifique acima se os arquivos foram enviados com sucesso.
echo   Se sim, o deploy na Render comecara sozinho em alguns segundos.
echo ====================================================================
echo.
pause
