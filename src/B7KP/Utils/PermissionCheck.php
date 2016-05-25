<?php 
namespace B7KP\Utils;

use B7KP\Interfaces\iPermission;

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
}
?>