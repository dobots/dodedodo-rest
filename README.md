# REST API for Dodedodo

The REST API for Dodedodo. Instead of the website [http://www.dodedodo.com](http://www.dodedodo.com), this allows you to create your own favorite GUI around the Dodedodo infrastructure or address its functionality from the command line for example.

## Installation

Get it:

    git clone https://github.com/dobots/dodedodo-rest

Set a few environmental variables:

    export DODEDODO_USERNAME=username
    export DODEDODO_PASSWORD=password

Add them to your shell script if you like.

Install everything:

    cd dodedodo-rest
    npm install

There is one dependency (besides node and npm), namely a MongoDB database. You will not get it through `npm install -g mongodb` because that is only a driver connecting to a MongoDB database. Follow the directions on [mongodb.org](http://docs.mongodb.org/manual/tutorial/install-mongodb-on-ubuntu/), something along the lines:

    sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
    sudo apt-add-repository http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen
    sudo apt-get update
    sudo apt-get install mongodb-10gen

Run the server:

    node web.js

This starts the server at `localhost:5000`. Now, you can navigate to the `scripts` directory and start to play around with the REST interface. For example, to login with a previously registered account on [Dodedodo](http://www.dodedodo.com):

    curl -c cookie localhost:5000/users/management --data "name=$DODEDODO_USERNAME&password=$DODEDODO_PASSWORD"

This creates your account locally. To subsequently log in, use:

    curl -c cookie localhost:5000/users/authentication --data "name=$DODEDODO_USERNAME&password=$DODEDODO_PASSWORD"

To perform a request to the XMPP server which updates the local database.

    curl -b cookie $DODEDODO_SERVER:$DODEDODO_PORT/modules/list

And to read out the local database:

    curl -b cookie $DODEDODO_SERVER:$DODEDODO_PORT/modules/database

Have fun!

## Copyrights
The copyrights (2014) belong to:

- Author: Anne van Rossum
- Almende B.V., http://www.almende.com and DoBots B.V., http://www.dobots.nl
- Rotterdam, The Netherlands

