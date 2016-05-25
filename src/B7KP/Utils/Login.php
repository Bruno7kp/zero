<?php 
namespace B7KP\Utils;

use B7KP\Model\Model;
use B7KP\Core\App;

class Login
{
	private $login;
	private $password;
	private $factory;
	
	function __construct($login, $password, Model $factory)
	{
		$this->login 	= $login;
		$this->password = $password;
		$this->factory 	= $factory;
	}

	public function login($entity = "B7KP\Entity\User")
	{
		$user = $this->factory->findOneBy($entity, $this->login, "login");
		if($user instanceof $entity)
		{
			$login = Pass::check($this->password, $user->password);
			if($login)
			{
				$_SESSION[App::get("name")][strtoupper($entity)] = $user->id;
			}
			return $login;
		}
		else
		{
			return false;
		}
	}

	static function logout()
	{
		unset($_SESSION[App::get("name")]["USER"]);
	}
}
?>