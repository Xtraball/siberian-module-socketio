function Siberian_Customers(siberian) {
    if(siberian.constructor.name !== "Siberian")
        throw new Error("Please use a Siberian object to instantiate this class.");

    var self = this; // siberian.customers

    self.fromSessionID = require("./from_session_id")(siberian);
    self.fromID = require("./from_id")(siberian);

    self.withMetadatas = require("./with_metadata")(siberian);

    return self;
}

module.exports = function (siberian) { return new Siberian_Customers(siberian); };
