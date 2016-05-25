<?php 
/**
* src/Security/Pass.php
*/
class Pass
{
	
	static function encrypt($password)
	{
		$hash = null;
		if(!empty($password))
		{
			$cust = '08';
			$salt = 'Cf1f11ePArKlBJomM0F6aJ';
			$hash = crypt($password, '$2a$' . $cust . '$' . $salt . '$');
		}
		return $hash;
	}

	static function check($password, $hash)
	{
		return crypt($password, $hash) === $hash;
	}
}
?>