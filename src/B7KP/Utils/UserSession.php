<?php
namespace B7KP\Utils;

use B7KP\Model\Model;
use B7KP\Core\App;
use B7KP\Entity\User;

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
}
?>