function Siberian(baseDir) {
    var _ = require("lodash");
    var fs = require("fs");
    
    if(!_.isString(baseDir))
        throw new Error("You must specify baseDir as a string!");

    try {
        fs.accessSync(baseDir, fs.F_OK);
    } catch(e) {
        throw new Error("Can't find baseDir folder: "+baseDir);
    }

    var self = this;

    self.base = baseDir;
    self.application = require("./application")(self);
    self.customers = require("./customers")(self);

    return self;
};

module.exports = function(baseDir) { return new Siberian(baseDir); };