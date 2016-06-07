<?php 
namespace B7KP\Controller;

use B7KP\Model\Model;
use B7KP\Utils\UserSession;
use B7KP\Utils\Login;
use B7KP\Library\Assert;
use B7KP\Library\Url;
use B7KP\Library\Route;
use B7KP\Library\Lang;

class LoginController extends Controller
{
	function __construct(Model $factory)
	{
		parent::__construct($factory);
	}

	/**
	* @Route(name=login|route=/login)
	*/
	public function indexAction()
	{
		$this->checkAccess();
		$form = $this->createForm("LoginForm");
		$var = array("form" => $form);
		$this->render("login.php", $var);
	}

	/**
	* @Route(name=check_login|route=/check/login)
	*/
	public function checkLogin()
	{
		$post = (object)$_POST;
		if($this->isAjaxRequest())
		{
			if($this->checkAssert($post))
			{
				$login = new Login($post->login, $post->password, $this->factory);
				if($login->login())
				{
					$response = array("erro" => 0, "message" => "Success", "call" => "goTo", "url" => Route::url('userprofile'));
				}
				else
				{
					$response = array("erro" => 1, "message" => Lang::get("invalid_user_login"));
				}
			}
			else
			{
				$response = array("erro" => 1, "message" => $this->assertErrors[0]["error"]);
			}
			echo json_encode($response);
		}
		else
		{
			$this->redirectToRoute("home");
		}
	}

	/**
	* @Route(name=logout|route=/logout)
	*/
	public function logout()
	{
		Login::logout();
		$this->redirectToRoute("home");
	}

	protected function checkAccess()
	{
		if(UserSession::getUser($this->factory) != false)
		{
			$this->redirectToRoute("home");
		}
	}

	private function checkAssert($post)
	{
		$assert = new Assert();
		$assert->check("\B7KP\Entity\User", $post, false);
		$ignore = array("unique", "different");
		$this->assertErrors = $assert->getErrors($ignore);

		return count($this->assertErrors)==0;
	}
}
?>