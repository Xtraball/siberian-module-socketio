function Siberian_Application(siberian) {
    if(siberian.constructor.name !== "Siberian")
        throw new Error("Please use a Siberian object to instantiate this class.");

    var self = this; // siberian.application

    self.config = require("./config")(siberian);
    self.db = require("./db")(siberian);
    self.path = require("./path")(siberian);

    return self;
};

module.exports = function (siberian) { return new Siberian_Application(siberian); };