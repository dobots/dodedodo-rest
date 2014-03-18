#!/bin/sh

. ./config

index=${1:? "$0 requires \"index\" as first argument"}

echo "Dependency: underscore"
echo "  get it from https://github.com/ddopson/underscore-cli"

echo "Make sure you did run ./modules.sh database"

module=$(< $DODEDODO_MODULES_FILE underscore extract modules | underscore find "key == $index")

echo '{"module":' > module.txt
echo $module >> module.txt
echo '}' >> module.txt

# Replace first occurence in a file
sed -i '0,/name/s/name/module_name/' module.txt

# Just quickly grep last device
device_str=$(< $DODEDODO_DEVICES_FILE underscore extract devices | tail -n2 | head -n1)

#device=$(< $DODEDODO_DEVICES_FILE underscore extract devices | tac | sed '1 s|]|[|' | sed '$ s|\[|]|' | underscore find "key == 0" )
device=$(echo $device_str | underscore extract name)

echo "Deploy on device: $device"

# Just plug in the device to deploy too
sed -i "s|\"description\"|\"deploy\":$device, \"description\"|" module.txt


content=$(cat module.txt)
#echo $content

curl -b cookie $DODEDODO_SERVER:$DODEDODO_PORT/modules/deploy -H "Content-Type: application/json" --data "$content"

