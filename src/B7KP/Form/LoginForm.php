<?php
namespace B7KP\Form;

use B7KP\Library\Route;
use B7KP\Library\Lang;

class LoginForm extends Form
{

	function __construct(){}

	public function build($obj = false)
	{
		$this->obj = $obj;
		$form = $this
				->init(Route::url("check_login"))
				->add(self::TYPE_TEXT, "login", "input-lg form-control", array(), Lang::get("username"))
				->add(self::TYPE_PASS, "password", "input-lg form-control", array())
				->add(self::TYPE_CHECK, array("cookie"), "checkbox", array(), array("stay_logged"))
				->add(self::TYPE_SUBMIT, "submit", "send btn btn-success")
				->end();
	}

}
?>