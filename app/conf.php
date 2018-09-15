<?php
set_time_limit(60);
require_once "vendor/autoload.php";
//B7KP\Library\Url::fix();
$dotenv = new Dotenv\Dotenv(__DIR__."/../");
$dotenv->load();
$dao = B7KP\Core\Dao::getConn();
$factory = new B7KP\Model\Model($dao);
session_start();
B7KP\Utils\UserSession::controlUserAccess("all", $factory);
?>