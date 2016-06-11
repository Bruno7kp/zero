<?php
namespace B7KP\Controller;

use B7KP\Model\Model;
use B7KP\Library\Assert;
use B7KP\Library\Url;
use B7KP\Utils\Login;
use B7KP\Entity\User;
use B7KP\Utils\UserSession;
use LastFmApi\Main\LastFm;

class RegisterController extends Controller
{
	function __construct(Model $factory)
	{
		parent::__construct($factory);
	}

	/**
	* @Route(name=register|route=/register)
	*/
	public function indexAction()
	{
		$var = array();
		$this->checkAccess();
		$get = (object)$_GET;
		if(isset($get->token))
		{
			$lfm_user = $this->checkToken($get->token);
			if(!is_null($lfm_user))
			{
				$get->login = $lfm_user;
				$form = $this->createForm("RegisterForm", $get);
				$var = array("form" => $form, "lfm_user" => $lfm_user);
				$this->render("register.php", $var);
				return;
			}
			else
			{
				$var["error"] = true;
			}
		}
		$this->render("auth.php", $var);
	}

	/**
	* return = username or null
	*/
	private function checkToken($token)
	{
		$lfm = new LastFm();
		return $lfm->setToken($token);
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
				$id = $this->factory->add("B7KP\Entity\User", $post);
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

	/**
	* @Route(name=check_admin_register|route=/check/admin/register)
	*/
	public function checkAdminRegister()
	{
		$post = (object)$_POST;
		if($this->isAjaxRequest())
		{
			if($this->checkAssert($post))
			{
				$id = $this->factory->add("B7KP\Entity\User", $post);
				if($id > 0)
				{
					//$login = new Login($post->login, $post->password, $this->factory);
					//$login->login();
					$response = array("erro" => 0, "message" => "Success", "call" => "goTo", "url" => Url::getBaseUrl()."/user/".$post->login);
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
		$assert->check("\B7KP\Entity\User", $post, false);
		$this->assertErrors = $assert->getErrors();

		return count($this->assertErrors)==0;
	}
}
?>