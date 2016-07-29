<?php
# Register the node server in the cron scheduler
Siberian_Feature::installCronjob(
    "Node server watchdog",
    "SocketIO_Model_SocketIO_Module::serve",
    -1,
    -1,
    -1,
    -1,
    -1,
    true,
    5,
    1
);

#
$data = array(
    "code" => "node_binary_path",
    "label" => "",
    "value" => "",
);

$config = new System_Model_Config();
$config
    ->setData($data)
    ->insertOnce(array("code"));