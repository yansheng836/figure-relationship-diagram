@echo off

sh ./gen_urls.sh
git add .
set date_str=%date:~0,4%-%date:~5,2%-%date:~8,2% %time:~0,2%:%time:~3,2%:%time:~6,2%
git commit -m "chore: backup files on %date_str%"
git push origin main

::pause
