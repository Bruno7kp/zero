<?php
namespace B7KP\Controller;

class UserEditController extends Controller
{
	private $user;

	function __construct(MainFactory $factory)
	{
		parent::__construct($factory);
		$this->user = UserSession::getUser($this->factory);
	}

	/**
	* @Route(name=useredit|route=/edit)
	*/
	public function indexAction()
	{
		$this->checkAccess();
		$form = $this->createForm("UserEditForm", $this->user);
		$var = array("form" => $form);
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
				$affected = $this->factory->update("User", $post);
				if($affected > 0)
				{
					$response = array("erro" => 0, "message" => "Success", "call" => "goTo", "url" => Route::url("userprofile"));
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
		$assert->check("User", $post, false);
		$this->assertErrors = $assert->getErrors();

		return count($this->assertErrors)==0;
	}
}
?>