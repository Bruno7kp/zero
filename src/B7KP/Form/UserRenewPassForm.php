<?php
namespace B7KP\Form;

use B7KP\Library\Route;
use B7KP\Library\Lang;

class UserRenewPassForm extends Form
{

	function __construct(){}

	public function build($obj = false)
	{
		$this->obj = $obj;
		$form = $this
				->init(Route::url("renew_profile_pass"))
				->add(self::TYPE_HIDDEN, "user", "input-lg form-control")
				->add(self::TYPE_PASS, "new_pass", "input-lg form-control")
				->add(self::TYPE_PASS, "new_pass_repeat", "input-lg form-control")
				->add(self::TYPE_SUBMIT, "submit", "send btn btn-primary btn-lg")
				->end();
	}

}
?>