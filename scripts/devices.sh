#!/bin/sh

. ./config

usage="
  
  $0 [command]:
  
  command:
  - request: Request an update of devices from the XMPP server
  - database: List devices currently in the database"

command=${1:? "$0 requires \"command\" as first argument: $usage"}

case $command in
	request)
		curl -b cookie $DODEDODO_SERVER:$DODEDODO_PORT/devices/list
		;;
	database)
		echo "Write results to $DODEDODO_DEVICES_FILE"
		curl -s -b cookie $DODEDODO_SERVER:$DODEDODO_PORT/devices/database -o $DODEDODO_DEVICES_FILE
		;;
	*)
		echo "Unknown command"
		;;
esac
