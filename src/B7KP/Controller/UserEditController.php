<?php
namespace B7KP\Controller;

use B7KP\Model\Model;
use B7KP\Utils\UserSession;
use B7KP\Utils\Login;
use B7KP\Library\Assert;
use B7KP\Library\Route;
use B7KP\Entity\User;

class UserEditController extends Controller
{
	private $user;

	function __construct(Model $factory)
	{
		parent::__construct($factory);
		$this->user = UserSession::getUser($this->factory);
	}

	/**
	* @Route(name=useredit|route=/edit/email)
	*/
	public function indexAction()
	{
		$this->checkAccess();
		$form = $this->createForm("UserEditForm", $this->user);
		$var = array("form" => $form, "field" => "E-mail");
		$this->render("edit.php", $var);
	}

	protected function checkAccess()
	{
		if(!$this->user instanceof User)
		{
			$this->redirectToRoute("home");
		}
	}

	/**
	* @Route(name=edit_profile|route=/check/profile/edit)
	*/
	public function checkEdit()
	{
		$post = (object)$_POST;
		if($this->isAjaxRequest())
		{
			$post->id = $this->user->id;
			if($this->checkAssert($post))
			{
				$affected = $this->factory->update("B7KP\Entity\User", $post);
				if($affected)
				{
					$response = array("erro" => 0, "message" => "Success", "call" => "goTo", "url" => Route::url("useredit"));
				}
				else
				{
					$response = array("erro" => 1, "message" => "Oops, something went wrong");
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