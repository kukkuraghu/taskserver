start/min  start_db.bat
set NODE_ENV=development
set debug=tasksServer:*
REM database server ip and port. Also the database name
REM set db_ip=127.0.0.1
set db_ip=localhost
set db_Port=27017
set db_name=recrankcasedb
REM
REM set the web server ip and port
REM set server_ip=127.0.0.1
REM set server_ip=127.0.0.1
set server_ip=localhost
set PORT=3000
node bin/www

