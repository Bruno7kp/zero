<?php
/**
* src/Entity/User.php
*/
class User extends Entity implements iPermission
{
	/**
	* @Assert(null=false|alfanum|max=20|min=3|unique|lastfm|different=["admin", "adm", "user", "superuser"])
	*/
	protected $login;

	/**
	* @Assert(null=false|max=20|min=4|notContainFields=login)
	*/
	protected $password;

	/**
	* @Assert(null=false|email|unique)
	*/
	protected $email;

	/**
	* @Assert(null=false)
	*/
	protected $name;

	/**
	* @Assert(null=true)
	*/
	protected $avatar;

	function __construct()
	{
		parent::__construct();
	}

	function permissionLevel()
	{
		return 1;
	}
}
?>