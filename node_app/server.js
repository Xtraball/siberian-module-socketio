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

var http = require("http");
var https = require("https");
var tls = require("tls");
var io = require('socket.io')();

var print_status = argv.status;
var kill = argv.kill;
var pid = null, port = 35500, max_port = 36000;
var pid_folder = path.join(siberian_path, "var/pid/");
var pid_path = path.join(pid_folder, "socketio.pid");

var Server = {};

Server.init = function() {
    var port_config = _.get(siberian.application.config.app.ini, "production.siberian.socketio.port", "");
    if(_.isString(port_config)) {
        port_config =  _.trim(port_config);
        var port_config_matches = port_config.match(/^(\d+)(?:-(\d+))?$/);
        if(port_config_matches) {
            port = +(port_config_matches[1]);
            max_port = +(port_config_matches[2] || port);
        }
    }

    return new Promise(function(resolve,reject){
        try { fs.mkdirSync(pid_folder); } catch(e) { if(e.code !== "EEXIST") reject(e); }

        try {
            var pidfile = fs.readFileSync(pid_path, {encoding:"UTF-8"});
            if(typeof pidfile === "string" && pidfile.indexOf(":")) {
                var data = pidfile.split(":");
                pid = parseInt(data[0], 10) || null; current_port = parseInt(data[1], 10) || null;
            }
        } catch (e) {
            if(e.code !== "ENOENT") {
                reject(e);
            }
        }

        if(kill) {
            try {
                if(pid > 0) {
                    process.kill(pid, "SIGKILL");
                } else {
                    console.warn("Warning: no PID exists");
                }
                try {
                    fs.unlinkSync(pid_path);
                } catch (e) {
                    if(e.code !== "ENOENT") {
                      reject(e);
                    }
                }
            } catch (e) {  // will throw an exception if pid doesn't exists
                if(e.errno === "ESRCH") {
                    console.warn("Warning: PID "+pid+ " doesn't exists");
                } else {
                    reject(e);
                }
            }
            console.log("killed");
        } else {
            check_server(function(server_running) {
                if(print_status) {
                    console.log(server_running ? "running" : "stopped");
                } else {
                    if(server_running) {
                        console.log("Server is already running.");
                    } else {
                        if(pid) {
                            // force kill old server just in case it hanged
                            try { process.kill(pid, 9); } catch (e) { }
                        }
                        resolve();
                    }
                }
            });
        }
    });
};

Server.start = function() {
    console.log("---STARTING---");
    return getHttpOptions().then(function(res){
        var server;

        //HTTP stuff
        if(res.protocol === "http") {
            console.log("Using HTTP protocol");
            server = http.createServer();

            //HTTPS Stuff
        } else {
            console.log("Using HTTPS protocol");
            if(_.keys(res.certs).length < 1) {
                throw new Error("No HTTPS certificates found");
            }

            var certificates = {};
            var wildcards = {};
            var has_wildcards = false;

            _.forIn(res.certs, function(certs_info, domain) {

                //replace key by file content
                if(fs.existsSync(certs_info.key)) {
                    certs_info.key = fs.readFileSync(certs_info.key);
                } else {
                    delete certs_info.key;
                }

                //replace cert by file content
                if(fs.existsSync(certs_info.cert)) {
                    certs_info.cert = fs.readFileSync(certs_info.cert);
                } else {
                    delete certs_info.cert;
                }

                //replace ca by file content
                if(fs.existsSync(certs_info.ca)) {
                    certs_info.ca = fs.readFileSync(certs_info.ca);
                } else {
                    delete certs_info.ca;
                }

                certificates[domain] = certs_info;

                if(domain.indexOf("*")) {
                    has_wildcards = true;
                    _.set(wildcards, _.reverse(domain.replace(/(\.)+/g, "$1").split(".")), {".": true});
                }

            });

            //Default cert is first one
            var https_options = _.clone(_.values(certificates)[0]);

            //use SNI if more than one certs
            if(_.keys(res.certs).length > 1) {
                https_options.SNICallback = function(servername, callback) {
                    var adhoc_cert = certificates[servername];

                    if(!adhoc_cert && has_wildcards) {
                        reversed_sn = servername.replace(/(\.)+/g, "$1").split(".").reverse().join(".");

                        while(reversed_sn.indexOf(".") >= 0) {
                            path = reversed_sn;
                            if(!!_.get(wildcards, path+"['.']", false)) break; // We found certificate, break out of loop

                            path = reversed_sn.replace(/\.[^\.]*$/, "\.*");
                            if(!!_.get(wildcards, path+"['.']", false)) break; // We found wildcard certificate, break out of loop

                            reversed_sn = reversed_sn.replace(/\.[^\.]*$/, "");
                        }

                        adhoc_cert = certificates[path.split(".").reverse().join(".")];
                    }

                    if(adhoc_cert) {
                        console.log("SINCallback found certificate for domain: "+servername+".");

                        var context = tls.createSecureContext(adhoc_cert);

                        // Compatibility with old versions of node
                        if (callback) {
                            return callback(null, context);
                        } else {
                            return context;
                        }
                    } else {
                        console.warn("SNICallback could not find a certificate for domain: "+servername+".");
                    }
                    return null;
                };
            }

            console.log("Default certificate: ");
            console.log("Configuration:\n", https_options);
            console.log("Certificates available for domains: ");
            _.forEach(certificates, function(cert, domain) {
                console.log("- "+domain);
            });

            server = https.createServer(https_options);
        }

        server.on("listening", function() {
            io.attach(server);
            console.log("Listening on port: "+port);

            fs.writeFileSync(pid_path, process.pid+":"+port, {encoding:'utf-8'});

            siberian.application.db.query(
                "UPDATE system_config SET value=? WHERE code=?",
                [port, "socket_io_port"],
                function(err, results) {
                    if(err) {
                        throw err;
                    }
                    if(results.affectedRows < 1) {
                        siberian.application.db.query("INSERT INTO system_config SET ?",
                                                      {
                                                          value: port,
                                                          code: "socket_io_port",
                                                          label: "SocketIO Port"
                                                      },
                                                      function(err, results) {
                                                          if (err){
                                                              throw err;
                                                          }
                                                          if(results.affectedRows < 1) {
                                                              console.error("Can't store SocketIO port in the database!");
                                                          } else {
                                                              Server.runModules();
                                                          }
                                                      }
                                                     );
                    } else {
                        Server.runModules();
                    }
                }
            );
        });

        server.on("error", function(err) {
            if(err.errno === 'EADDRINUSE') {
                console.warn("Failed using port "+port+" -> "+err.errno);
                if(port < max_port) {
                    port++;
                    server.listen(port);
                    return;
                }
            }
            throw err;
        });

        server.listen(port);
    }, function(err){
        throw err;
    });
};

Server.runModules = function(){
  // Requiring modules
    siberian.application.db.query("SELECT name, path FROM socket_io;", function(err, results) {
        if (err){
            throw err;
        }

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
                } catch(e) {
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


/**
 * Utilities functions
 */
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
            if(current_port) {
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

                socket.connect(current_port);

                return;
            }
        }
    }
    cb(false);
}

function getHttpOptions() {
    return new Promise(function(resolve,reject){
        siberian.application.db.query("SELECT value FROM system_config WHERE code = 'use_https';", function(err, protocol_result) {
            if(err){
                reject(err);
            }

            //if HTTPS
            if(protocol_result && protocol_result[0] && protocol_result[0] && protocol_result[0].value == 1) {
                //GET ssl informations
                siberian.application.db.query("SELECT * FROM ssl_certificates;", function(err, results) {

                    if(err) {
                        reject(err);
                    }

                    var certs = {};
                    for(var i=0; i<results.length; i++){
                        var result = results[i];

                        //foreach domain managed by certificate, add a new entry. Will be usefull ofr SNI
                        //note: hostname is in domains (but sometime not, so let's verify)
                        if(result.domains) {
                            var domains = JSON.parse(result.domains) || [];
                            var hostname = _.isString(result.hostname) ? result.hostname.trim() : null;

                            if(hostname && domains.indexOf(hostname) === -1) {
                                domains.push(hostname);
                            }

                            for(var j=0; j<domains.length; j++) {
                                var domain = domains[j];
                                certs[domain] = {
                                    "ca":result.fullchain,
                                    "cert":result.certificate,
                                    "key":result.private
                                };
                            }
                        }
                    }

                    resolve({
                        "protocol":"https",
                        "certs":certs
                    });

                });
            //if HTTP
            } else {
                resolve({"protocol":"http"});
            }
        });
    });
}

Server.init()
    .then(Server.start)
    .catch(function(err){
        console.error(err);
        process.exit(500);
    });
