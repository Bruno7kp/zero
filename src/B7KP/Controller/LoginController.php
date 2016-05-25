<?php 
namespace B7KP\Controller;

class LoginController extends Controller
{
	function __construct(MainFactory $factory)
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
					$response = array("erro" => 0, "message" => "Success", "call" => "goTo", "url" => Url::getBaseUrl());
				}
				else
				{
					$response = array("erro" => 1, "message" => "Login or password invalid");
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
		$assert->check("User", $post, false);
		$ignore = array("unique", "different");
		$this->assertErrors = $assert->getErrors($ignore);

		return count($this->assertErrors)==0;
	}
}
?>