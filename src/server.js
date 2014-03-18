/*
 * The express server is exported, but also an http server wrapped around it. This is required for the socket.io 
 * library which is used to communicate with websockets to the frontend. Make sure you, in the end, use 
 * server.listen() and not app.listen() or the websocket functionality will not work.
 */
var express = require('express');
var app = express();

var server = require('http').createServer(app);

exports.app = app;
exports.server = server;