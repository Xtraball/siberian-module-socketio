function Siberian_Application_Path(siberian) {
    if(siberian.constructor.name !== "Siberian")
        throw new Error("Please use a Siberian object to instantiate this class.");

    var _ = require("lodash");
    var fs = require("fs");
    var path = require("path");

    var self = this; // siberian.application.path

    /*
     * Resolve path looking first in local, then sae, mae and pe
     *
     * @params pathname path to look for
     * @returns resolved existing path or null if it hasn't been found
     */
    self.resolve = function(pathname) {
        var types = [
            "local",
            "pe",
            "mae",
            "sae"
        ];

        for(var i=0; i<types.length; i++) {
            try {
                var resolved = path.resolve(siberian.base, path.join("./app/", types[i], "./modules/", pathname));
                fs.accessSync(resolved, fs.F_OK);
                // If we have no error, we're good
                return resolved;
            } catch(e) {
            }
        }

        return null;
    };

    return self;
};

module.exports = function (siberian) { return new Siberian_Application_Path(siberian); };