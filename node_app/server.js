#!/usr/bin/env node
var app = require('express')();
var server = require('http').createServer(app);

var path = require('path');
var process = require("process");
var _ = require('lodash');
var argv = require('yargs').argv;

var siberian_path = path.resolve(process.cwd(), argv._[0]); // path.resolve(__dirname, '../../../../../');
var siberian = require('./siberian')(siberian_path);

app.get('/running', function (req, res) {
  res.send('true');
});

var io = require('socket.io')(server);

siberian.application.db.query("SELECT name, path FROM socket_io;", function(err, results) {
  if (err) throw err;

  var launched = 0;

  for(var i=0; i<results.length; i++){
    var result = results[i];
    var module_path = siberian.application.path.resolve(result.path);

    console.log("Starting module "+result.name+" at path: ");
    console.log("\t"+module_path);

    try {
      var module = require(module_path);
      if(_.isFunction(module)) {
        var instance = module(siberian, io);
        if(_.isObject(instance)) {
          if(_.isFunction(instance.run)) {
            instance.run();
            launched++;
          } else {
            console.error("Instance of module has no run function!");
          }
        } else {
          console.error("Instance of module is not an object!");
        }
      } else {
        console.error("Module is not a function!");
      }
    }
    catch(e) {
      if(e.message.match(/^Cannot find module/)) {
        console.error(e.message);
      } else {
        throw e;
      }
    }
  }

  if(launched < 1) {
    console.warn("No module running. Exiting.");
    process.exit(404);
  }
});


server.listen(35500);
