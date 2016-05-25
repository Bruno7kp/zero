<?php
namespace B7KP\Controller;

class DefaultController extends Controller
{
	function __construct(MainFactory $factory)
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