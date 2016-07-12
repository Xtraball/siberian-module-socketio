<?php
class SocketIO_Model_SocketIO_Module extends Core_Model_Default
{

    public function __construct($params = array())
    {
        parent::__construct($params);
        $this->_db_table = 'SocketIO_Model_Db_Table_SocketIO_Module';
        return $this;
    }

    /*
     * Add a socket.io module to execute
     *
     * @params string $name Name of the module (could be anything)
     * @params string $path Path of the JS file of the module (e.g. : MyModule/resources/socketio/mymodule.js)
     * @returns SocketIO_Model_SocketIO_Module added model
     */
    public static function installSocket($name, $path) {
        $module = new self();
        return $module->setData(array(
            "name" => $name,
            "path" => $path
        ))->insertOrUpdate(array("path"));
    }

}