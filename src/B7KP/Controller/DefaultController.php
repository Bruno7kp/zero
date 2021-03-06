<?php
namespace B7KP\Controller;

use B7KP\Model\Model;

class DefaultController extends Controller
{
	function __construct(Model $factory)
	{
		parent::__construct($factory);
	}

	/**
	* @Route(name=home|route=/)
	*/
	public function indexAction()
	{
		$this->checkAccess();
		$this->render("index.php");
	}

	protected function checkAccess()
	{
		return true;
	}
}
?>