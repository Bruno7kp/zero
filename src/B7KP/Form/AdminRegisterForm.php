<?php
namespace B7KP\Form;

use B7KP\Library\Route;

class AdminRegisterForm extends Form
{

	function __construct(){}

	public function build($obj = false)
	{
		$obj = new \stdClass();
		$obj->isadmin = true;
		$this->obj = $obj;
		$form = $this
				->init(Route::url("check_admin_register"))
				->add(self::TYPE_TEXT, "login", "input-lg form-control", array(), "Last.fm Username")
				->add(self::TYPE_MAIL, "email", "input-lg form-control")
				->add(self::TYPE_PASS, "password", "input-lg form-control")
				->add(self::TYPE_SUBMIT, "submit", "send btn btn-primary btn-lg")
				->end();
	}

}
?>