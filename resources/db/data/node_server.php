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

# Detect node
try {
    $bin_path = false;

    # Test 1
    exec("/usr/local/bin/nodejs --version 2>&1", $output, $return_val);
    if($return_val === 0) {
        $bin_path = "/usr/local/bin/nodejs";
    }

    # Test 2
    if(!$bin_path) {
        exec("/usr/bin/nodejs --version 2>&1", $output, $return_val);

        if($return_val === 0) {
            $bin_path = "/usr/bin/nodejs";
        }
    }

    # Test 3
    if(!$bin_path) {
        exec("/usr/local/bin/node --version 2>&1", $output, $return_val);

        if($return_val === 0) {
            $bin_path = "/usr/local/bin/node";
        }
    }

    # Test 4
    if(!$bin_path) {
        exec("/usr/bin/node --version 2>&1", $output, $return_val);

        if($return_val === 0) {
            $bin_path = "/usr/bin/node";
        }
    }

    # Fallback
    if(!$bin_path) {
        # Windows
        # $exe_32_path = Core_Model_Directory::getBasePathTo("/app/local/modules/SocketIO/resources/bin/node_32.exe");
        # $exe_64_path = Core_Model_Directory::getBasePathTo("/app/local/modules/SocketIO/resources/bin/node_32.exe");

        # Chmod +x allow for execution
        $bin_path = Core_Model_Directory::getBasePathTo("/app/local/modules/SocketIO/resources/bin/");
        exec("chmod +x {$bin_path}*");

        # Fallback with the node binaries
        # MacOSX
        $is_darwin = exec("uname");
        if(strpos($is_darwin, "arwin") !== false) {
            $bin_path = Core_Model_Directory::getBasePathTo("/app/local/modules/SocketIO/resources/bin/node_64.osx");
            # Windows
        } else {
            $bin_32 = Core_Model_Directory::getBasePathTo("/app/local/modules/SocketIO/resources/bin/node_32");
            exec($bin_32." --version 2>&1", $output, $return_val);

            if($return_val === 0) {
                $bin_path = $bin_32;
            } else {

                $bin_64 = Core_Model_Directory::getBasePathTo("/app/local/modules/SocketIO/resources/bin/node_64");
                exec($bin_64." --version 2>&1", $output, $return_val);

                if($return_val === 0) {
                    $bin_path = $bin_64;
                }
            }
        }
    }

} catch (Exception $e) {
    $bin_path = false;
}

$data = array(
    "code" => "node_binary_path",
    "label" => "Node path",
    "value" => $bin_path,
);

$config = new System_Model_Config();
$config
    ->setData($data)
    ->insertOrUpdate(array("code"));
