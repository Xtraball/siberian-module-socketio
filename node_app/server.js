#!/usr/bin/env node
var path = require('path');
var fs = require('fs');
var net = require('net');
var process = require("process");
var onetime = require("onetime");
var _ = require('lodash');
var argv = require('yargs').argv;

var siberian_path = path.resolve(process.cwd(), argv._[0]);
var siberian = require('./siberian')(siberian_path);

var print_status = argv.status
var pid = null, port = null;
var pid_folder = path.join(siberian_path, "var/pid/");
try { fs.mkdirSync(pid_folder); } catch(e) { if(e.code !== "EEXIST") throw e; }
var pid_path = path.join(pid_folder, "socketio.pid");

try {
  var pidfile = fs.readFileSync(pid_path, {encoding:"UTF-8"});
  if(typeof pidfile === "string" && pidfile.indexOf(":")) {
    var data = pidfile.split(":");
    pid = parseInt(data[0], 10) || null; port = parseInt(data[1], 10) || null;
  };
} catch (e) {
  if(e.code !== "ENOENT") {
    throw e;
  }
}

check_server(function(server_running) {
  if(print_status) {
    console.log(server_running ? "running" : "stopped");
    process.exit(0);
  } else {
    if(server_running) {
      console.log("Server is already running.");
      process.exit(0);
    } else {
      if(pid) {
        // force kill old server just in case it hanged
        try { process.kill(pid, 9); } catch (e) { }
      }
      run_server();
    }
  }
});

function run_server() {
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

    try {
      fs.writeFileSync(pid_path, process.pid+":"+port, {encoding:'utf-8'});
    } catch (e) {
        process.exit(-1);
        throw e;
    }

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
      console.warn("Failed using port "+port+" -> "+err.errno);
      if(port < 36000) {
        port++;
        server.listen(port);
        return;
      }
    }
    throw err;
  })

  server.listen(port);
}

function check_server(cb) {
  cb = cb ? onetime(cb) : function () {};

  if(pid) {
    var process_exists = true;

    try {
      process.kill(pid, 0); // check for pid existence, will do nothing if exists
    } catch (e) {  // will throw an exception if pid doesn't exists
      if(e.errno === "ESRCH") {
        process_exists = false;
      }
    }

    if(process_exists) {
      if(port) {
        var socket = new net.Socket();
        var socket_alive = null;

        var onError = function () {
          socket.destroy();
          cb(false);
        };

        socket.setTimeout(1500);
        socket.on('error', onError);
        socket.on('timeout', onError);
        socket.on('connect', function () {
          socket.end();
          cb(true);
        });

        socket.connect(port);

        return;
      }
    }
  }

  cb(false);
}
