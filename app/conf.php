<?php
set_time_limit(60);
require_once "autoload.php";
//B7KP\Library\Url::fix();
$dao = B7KP\Core\Dao::getConn();
$factory = new B7KP\Model\Model($dao);
session_start();
B7KP\Utils\UserSession::controlUserAccess("all", $factory);
?>