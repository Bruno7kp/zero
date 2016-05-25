<?php 
namespace B7KP\Utils;

class Login
{
	private $login;
	private $password;
	private $factory;
	
	function __construct($login, $password, MainFactory $factory)
	{
		$this->login 	= $login;
		$this->password = $password;
		$this->factory 	= $factory;
	}

	public function login($entity = "User")
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