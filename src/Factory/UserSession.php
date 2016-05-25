<?php
/**
* src/Factory/UserSession.php
*/

class UserSession
{
	
	private function __construct(){}

	static function getUser(MainFactory $factory)
	{
		$o = false;
		if (isset($_SESSION[App::get("name")]["USER"])) {
			$user = $factory->findOneBy("User", $_SESSION[App::get("name")]["USER"]);
			if($user instanceof User)
			{
				$o = $user;
			}
		}

		return $o;
	}
}
?>