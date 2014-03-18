#!/bin/bash

echo "Connect to the Mongo database on localhost"

echo "If you are in the shell"
echo "show dbs"
echo "use dodedodo-dev"
echo "show collections"
echo "db.modules.find()"

echo 
echo "To e.g. remove a collection"
echo "db.modules.remove()"
echo
echo "Test with for instance db.users.find({\"jid\":\"name@dobots.customers.luna.net\"}) before calling db.users.remove(...)"
echo
echo "There are many resources online, check http://docs.mongodb.org"
echo "Have fun!"
echo

mongo localhost/dodedodo-dev 

