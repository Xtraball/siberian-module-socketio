function Siberian_Application_Config(siberian) {
    if(siberian.constructor.name !== "Siberian")
        throw new Error("Please use a Siberian object to instantiate this class.");

    var self = this; // siberian.application.config

    self.secrets = require("./secrets")(siberian);
    self.app = require("./app")(siberian);

    return self;
}

module.exports = function(siberian) { return new Siberian_Application_Config(siberian); };