<?php
class SocketIO_Bootstrap {

    public static function init($bootstrap) {
        # Registering node service
        Siberian_Service::registerService("SocketIO Server", array(
            "command" => "SocketIO_Model_SocketIO_Module::serviceStatus",
            "text" => "Running",
        ));

        # Register assets
        Siberian_Assets::registerAssets("SocketIo", "/app/local/modules/SocketIO/resources/var/apps/");
        Siberian_Assets::addJavascripts("modules/socketio/libraries/socket.io.min.js");
    }
}
