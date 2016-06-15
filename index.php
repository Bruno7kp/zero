<?php 
define("MAIN_DIR", __DIR__."/");

require_once("app/conf.php"); 
$u = B7KP\Utils\UserSession::getUser($factory);
if($u && $u->login == "Bruno7kp")
{
	B7KP\Library\Template::render();
}
else
{
	echo "Estamos atualizando o site, aguarde alguns minutos.";
}
?>