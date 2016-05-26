<?php
namespace B7KP\Entity;

use B7KP\Interfaces\iPermission;

class User extends Entity implements iPermission
{
	/**
	* @Assert(null=false|max=20|min=3|unique|lastfm|different=["admin", "adm", "user", "superuser"])
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

	function __construct()
	{
		parent::__construct();
	}

	function permissionLevel()
	{
		if(in_array(strtolower($this->login), $this->modUsers()))
		{
			return 5;
		}
		if(in_array(strtolower($this->login), $this->adminUsers()))
		{
			return 7;
		}
		return 1;
	}

	private function adminUsers()
	{
		return array('bruno7kp');
	}

	private function modUsers()
	{
		return array();
	}

}
?>