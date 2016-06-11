<?php
namespace B7KP\Controller;

use B7KP\Model\Model;

class AboutController extends Controller
{
	function __construct(Model $factory)
	{
		parent::__construct($factory);
	}

	/**
	* @Route(name=about|route=/faq)
	*/
	public function indexAction()
	{
		$this->checkAccess();
		$this->render("about.php");
	}

	protected function checkAccess()
	{
		return true;
	}
}
?>