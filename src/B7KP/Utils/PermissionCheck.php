<?php 
namespace B7KP\Utils;

use B7KP\Interfaces\iPermission;
use B7KP\Entity\User;
use B7KP\Utils\Friends;
use B7KP\Model\Model;

class PermissionCheck
{

	function __construct($entity)
	{
		$this->entity = $entity;
	}

	public function isPermitted($action, $obj)
	{
		$p = $this->permissionActions();
		if(isset($p[$action]))
		{
			if($obj instanceof iPermission)
			{
				if($obj->permissionLevel() >= $p[$action])
				{
					return true;
				}
				else
				{
					return false;
				}
			}
			else
			{
				if($action == "VIEW" || $action == "ACCESS")
				{
					return true;
				}
				else
				{
					return false;
				}
			}
		}
		else
		{
			return false;
		}
	}

	private function permissionActions()
	{
		$actions["ADMIN"] 	= 9;
		$actions["EDIT"] 	= 7;
		$actions["SELF"] 	= 5;
		$actions["VIEW"] 	= 3;
		$actions["ACCESS"] 	= 1;

		return $actions;
	}

	public function viewPermission(User $user, Model $factory, $permission)
	{
		$user_session = UserSession::getUser($factory);
		$friend = new Friends($factory);
		switch ($permission) {
			case 1:
				# friend
				return $friend->isFriend($user) || $user_session && $user_session->id == $user->id;
				break;

			default:
				# public
				return true;
				break;
		}
	}
}
?>