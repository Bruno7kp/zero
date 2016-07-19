<?php
namespace B7KP\Utils;

use B7KP\Model\Model;
use B7KP\Core\App;
use B7KP\Entity\User;
use B7KP\Library\Route;

class UserSession
{
	
	private function __construct(){}

	static function getUser(Model $factory)
	{
		$o = false;
		if (isset($_SESSION[App::get("name")]["B7KP\ENTITY\USER"])) 
		{
			$user = $factory->findOneBy("B7KP\Entity\User", $_SESSION[App::get("name")]["B7KP\ENTITY\USER"]);
			if($user instanceof User)
			{
				$o = $user;
			}
		}
		else if(isset($_COOKIE[App::get("name")."B7KP\ENTITY\USER"]))
		{
			$user = $factory->findOneBy("B7KP\Entity\User", $_COOKIE[App::get("name")."B7KP\ENTITY\USER"]);
			if($user instanceof User)
			{
				$o = $user;
			}
		}
		return $o;
	}

	static function controlUserAccess($currentlyaccessiblefor, Model $factory)
	{
		$u = self::getUser($factory);
		switch ($currentlyaccessiblefor) {
			case 'registered':
				if($u == false)
				{
					$route = Route::gerCurRoute();
					if(!in_array($route, array("login", "logout", "check_login")))
					{
						die("O site só está disponível para usuários já cadastrados. Caso já esteja, faça <a href='".Route::url("login")."'>login</a>");
					}
				}
				break;
			case 'logged':
				if($u == false)
				{
					die("O site está sendo atualizado. Aguarde alguns minutos.");
				}
				break;
			case 'mod':
				if($u == false || $u->permissionLevel() < 5)
				{
					die("O site está sendo atualizado. Aguarde alguns minutos.");
				}
				break;
			case 'admin':
				if($u == false || $u->permissionLevel() < 7)
				{
					die("O site está sendo atualizado. Aguarde alguns minutos.");
				}
				break;
			case 'master':
				if($u == false || $u->login != "Bruno7kp")
				{
					die("O site está sendo atualizado. Aguarde alguns minutos.");
				}
				break;
			
		}
	}
}
?>