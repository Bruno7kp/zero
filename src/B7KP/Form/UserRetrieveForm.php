<?php
namespace B7KP\Form;

use B7KP\Library\Route;
use B7KP\Library\Lang;

class UserRetrieveForm extends Form
{

	function __construct(){}

	public function build($obj = false)
	{
		//$this->obj = $obj;
		$form = $this
				->init(Route::url("forgotpass"), false, "get")
				->add(self::TYPE_TEXT, "user", "input-lg form-control")
				->add(self::TYPE_SUBMIT, "submit", "btn btn-primary btn-lg")
				->end();
	}

}
?>