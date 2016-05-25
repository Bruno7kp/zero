<?php
/**
* src/Controller/RegisterController.php
*/
class RegisterController extends Controller
{
	function __construct(MainFactory $factory)
	{
		parent::__construct($factory);
	}

	/**
	* @Route(name=register|route=/register)
	*/
	public function indexAction()
	{
		$this->checkAccess();
		$form = $this->createForm("RegisterForm");
		$var = array("form" => $form);
		$this->render("register.php", $var);
	}

	protected function checkAccess()
	{
		if(UserSession::getUser($this->factory) != false)
		{
			$this->redirectToRoute("home");
		}
	}

	/**
	* @Route(name=check_register|route=/check/register)
	*/
	public function checkRegister()
	{
		$post = (object)$_POST;
		if($this->isAjaxRequest())
		{
			if($this->checkAssert($post))
			{
				$id = $this->factory->add("User", $post);
				if($id > 0)
				{
					$login = new Login($post->login, $post->password, $this->factory);
					$login->login();
					$response = array("erro" => 0, "message" => "Success", "call" => "goTo", "url" => Url::getBaseUrl());
				}
				else
				{
					$response = array("erro" => 1, "message" => "Oops, we can't register your account, try again later");
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

	private function checkAssert($post)
	{
		$assert = new Assert();
		$assert->check("User", $post, false);
		$this->assertErrors = $assert->getErrors();

		return count($this->assertErrors)==0;
	}
}
?>