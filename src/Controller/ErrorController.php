<?php 
/**
* src/Controller/ErrorController.php
*/
class ErrorController extends Controller
{
	private $message = "Page not found";

	function __construct(MainFactory $factory)
	{
		parent::__construct($factory);
	}

	/**
	* @Route(name=404|route=/404)
	*/
	public function pageNotFoundAction()
	{
		$this->checkAccess();
		$this->render("error/404.php", array("message" => $this->message));
	}

	/**
	* @Route(name=403|route=/403)
	*/
	public function unauthorizedAction()
	{
		$this->checkAccess();
		$this->render("error/403.php");
	}

	/**
	* @Route(name=registernotfound|route=/404/{entity})
	*/
	public function registerNotFoundAction($entity)
	{
		$this->checkAccess();
		if(class_exists($entity))
		{
			$this->render("error/404.php", array("message" => ucfirst($entity)." not found"));
		}
		else
		{
			$this->redirectToRoute("404");
		}
	}

	protected function checkAccess()
	{
		return true;
	}
}
?>