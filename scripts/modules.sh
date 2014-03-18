#!/bin/sh

. ./config

usage="
  
  $0 [command]:
  
  command:
  - request: Request an update of modules from the XMPP server
  - database: List modules currently in the database"

command=${1:? "$0 requires \"command\" as first argument: $usage"}

case $command in
	request)
		curl -b cookie $DODEDODO_SERVER:$DODEDODO_PORT/modules/list
		;;
	database)
		echo "Write results to $DODEDODO_MODULES_FILE"
		curl -s -b cookie $DODEDODO_SERVER:$DODEDODO_PORT/modules/database -o $DODEDODO_MODULES_FILE
		;;
	*)
		echo "Unknown command"
		;;
esac
