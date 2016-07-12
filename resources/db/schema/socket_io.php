<?php
/**
 *
 * Schema definition for 'cron'
 *
 * Last update: 2016-07-08
 *
 */
$schemas = (!isset($schemas)) ? array() : $schemas;
$schemas['socket_io'] = array(
    'module_id' => array(
        'type' => 'int(11) unsigned',
        'auto_increment' => true,
        'primary' => true,
    ),
    'name' => array(
        'type' => 'varchar(128)',
    ),
    'path' => array(
        'type' => 'text',
    ),
    'created_at' => array(
        'type' => 'datetime',
    ),
    'updated_at' => array(
        'type' => 'datetime',
    ),
);