<?php
namespace B7KP\Entity;

use B7KP\Interfaces\iPermission;
use B7KP\Utils\UserSession;

class User extends Entity implements iPermission
{
	/**
	* @Assert(null=false|max=20|min=2|unique|lastfm)
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
	protected $lfm_register;

	/**
	* @Assert(null=true)
	*/
	protected $cookie;

	function __construct()
	{
		parent::__construct();
	}

	function permissionLevel($action = 'default', $field = null, $value = null)
	{
		switch ($action) {
		
			default:
				if(in_array(strtolower($this->login), $this->modUsers()))
				{
					return 5;
				}
				if(in_array(strtolower($this->login), $this->adminUsers()))
				{
					return 7;
				}
				return 1;
				break;
		}
	}

	function checkSelfPermission($factory)
	{
		$session = UserSession::getUser($factory);
		if($session && $session->id == $this->id)
		{
			return true;
		}

		return false;
	}

	private function adminUsers()
	{
		return array('bruno7kp', 'itsvictornunes');
	}

	private function modUsers()
	{
		return array();
	}

}
?>