#!/usr/bin/env node
var path = require('path');
var process = require("process");
var _ = require('lodash');
var argv = require('yargs').argv;

var siberian_path = path.resolve(process.cwd(), argv._[0]); // path.resolve(__dirname, '../../../../../');
var siberian = require('./siberian')(siberian_path);

var http = require("http");
var io = require('socket.io')();

var server = http.createServer();
var port = 35500;

var require_and_run_sockets = function() {
  // Requiring modules
  siberian.application.db.query("SELECT name, path FROM socket_io;", function(err, results) {
    if (err) throw err;

    var launched = 0;

    for(var i=0; i<results.length; i++){
      var result = results[i];
      var module_path = siberian.application.path.resolve(result.path);

      if(module_path === null) {
        console.error("Cannot resolve module '"+result.name+"' path from : "+result.path);
      } else {
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
    }


    if(launched < 1) {
      console.warn("No module running. Exiting.");
      process.exit(404);
    }
  });
};

server.on("listening", function() {
  io.attach(server);
  console.log("Listening on port: "+port);

  siberian.application.db.query("UPDATE system_config SET value=? WHERE code=?",
  [port, "socket_io_port"],
  function(err, results) {
    if (err) throw err;
    if(results.affectedRows < 1) {
      siberian.application.db.query("INSERT INTO system_config SET ?",
      {
        value: port,
        code: "socket_io_port",
        label: "SocketIO Port"
      },
      function(err, results) {
        if (err) throw err;
        if(results.affectedRows < 1) {
          console.error("Can't store SocketIO port in the database!");
        } else {
          require_and_run_sockets();
        }
      });
    } else {
      require_and_run_sockets();
    }
  });
});

server.on("error", function(err) {
  if(err.errno === 'EADDRINUSE') {
    if(port < 36000) {
      port++;
      server.listen(port);
      return;
    }
  }
  throw err;
})

server.listen(port);
