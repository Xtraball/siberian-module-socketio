<?php

use Siberian\Service;
use Siberian\Assets;

$init = function ($bootstrap) {
    # Registering node service
    Service::registerService("SocketIO Server", array(
        "command" => "SocketIO_Model_SocketIO_Module::serviceStatus",
        "text" => "Running",
    ));

    # Register assets
    Assets::registerAssets("SocketIo", "/app/local/modules/SocketIO/resources/var/apps/");
    ;Assets::addJavascripts("modules/socketio/libraries/socket.io.min.js");
};