<?php

use Siberian\Feature;

# Register the node server in the cron scheduler
$module = new Installer_Model_Installer_Module();
$module->prepare('SocketIO');

Feature::installCronjob(
    'Node server watchdog',
    'SocketIO_Model_SocketIO_Module::serve',
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
    $resourcePath = path('/app/local/modules/SocketIO/resources/bin/');
    exec('chmod +x ' . $resourcePath . '*');

    $binPath = false;

    $bin64 = path('/app/local/modules/SocketIO/resources/bin/node_64');
    exec($bin64 . ' --version 2>&1', $output, $return_val);

    if ($return_val === 0) {
        $binPath = $bin64;
    }
} catch (\Exception $e) {
    $binPath = false;
}

$data = [
    'code' => 'node_binary_path',
    'label' => 'Node path',
    'value' => $binPath,
];

$config = new System_Model_Config();
$config
    ->setData($data)
    ->insertOrUpdate(['code']);
