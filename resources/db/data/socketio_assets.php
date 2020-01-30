<?php

use Siberian\Assets;

# Copy assets during install process
Assets::copyAssets('/app/local/modules/SocketIO/resources/var/apps/');

//restart server with new assets
SocketIO_Model_SocketIO_Module::killServer();
