<?php
namespace B7KP\Controller;

use B7KP\Model\Model;
use B7KP\Core\Dao;
use B7KP\Entity\User;
use B7KP\Utils\UserSession;
use B7KP\Library\Route;

class SystemViewerController extends Controller
{
	private $user;

	function __construct(Model $factory)
	{
		parent::__construct($factory);
		$this->user = UserSession::getUser($factory);
	}

	/**
	* @Route(name=routes|route=/routes)
	*/
	public function viewRoutes()
	{
		$this->checkAccess();
		$routes = Route::getRoutes($this->user);
		ksort($routes);
		$vars = array("routes" => $routes);
		$this->render("admin/routes.php", $vars);
	}

	/**
	* @Route(name=users|route=/users)
	*/
	public function viewUsers()
	{
		$this->checkAccess();
		$users = $this->factory->find("B7KP\Entity\User", array());
		$vars = array("users" => $users);
		$this->render("admin/users.php", $vars);
	}

	/**
	* @Route(name=exec_query|route=/execute)
	*/
	public function executeQuery()
	{
		$this->checkAccess();
		$dao = Dao::getConn();

		//
	}

	/**
	* @Route(name=setuser|route=/setuser)
	*/
	public function setUsers()
	{
		$this->checkAccess();
		$form = $this->createForm("AdminRegisterForm");
		$this->render("admin/setuser.php", array("form" => $form));
	}

	protected function checkAccess()
	{
		$check = $this->user instanceof User && $this->user->permissionLevel() == 7;
		if(!$check)
		{
			$this->redirectToRoute("403");
		}
	}
}
?>