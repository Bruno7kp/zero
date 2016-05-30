<?php 
namespace B7KP\Interfaces;

interface iPermission
{
	public function permissionLevel($action, $field, $value);
}
?>