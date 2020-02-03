<?php

use Siberian\Feature;

# Register the node server in the cron scheduler
$module = new Installer_Model_Installer_Module();
$module->prepare("SocketIO");

Feature::installCronjob(
    "Node server watchdog",
    "SocketIO_Model_SocketIO_Module::serve",
    -1,
    -1,
    -1,
    -1,
    -1,
    true,
    5,
    1,
    $module->getId()
);

# Detect node
try {
    # Chmod +x allow for execution
    exec("chmod +x " . path("/app/local/modules/SocketIO/resources/bin/") . "*");

    $is_darwin = exec("uname");
    if (strpos($is_darwin, "arwin") !== false) {
        $bin_path = path("/app/local/modules/SocketIO/resources/bin/node_64.osx");
        # Windows
    } else {
        $bin_64 = path("/app/local/modules/SocketIO/resources/bin/node_64");
        exec($bin_64." --version 2>&1", $output, $return_val);

        if ($return_val === 0) {
            $bin_path = $bin_64;
        }
    }
} catch (\Exception $e) {
    $bin_path = false;
}

$data = [
    "code" => "node_binary_path",
    "label" => "Node path",
    "value" => $bin_path,
];

$config = new System_Model_Config();
$config
    ->setData($data)
    ->insertOrUpdate(["code"]);
