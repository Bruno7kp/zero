<?php
require_once "autoload.php";
$dao = Dao::getConn();
$factory = new MainFactory($dao);
session_start();
?>