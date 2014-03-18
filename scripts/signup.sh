#!/bin/sh

# Usage

echo "NOTE! First create an account on http://www.dodedodo.com"
echo "  (without it you cannot access the infrastructure)"
echo
echo "This script creates an account locally, in the Mongo database"
echo "A cookie is stored in \"cookie\""
echo
echo "This script assumes environmental variables:"
echo "  DODEDODO_USERNAME"
echo "  DODEDODO_PASSWORD"
echo

. ./config

echo "Result of query:"
curl -c cookie $DODEDODO_SERVER:$DODEDODO_PORT/users/management --data "name=$DODEDODO_USERNAME&password=$DODEDODO_PASSWORD"
