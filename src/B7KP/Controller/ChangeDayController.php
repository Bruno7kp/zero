<?php
namespace B7KP\Controller;

use B7KP\Model\Model;
use B7KP\Utils\UserSession;
use B7KP\Utils\Login;
use B7KP\Library\Assert;
use B7KP\Library\Route;
use B7KP\Entity\User;

class ChangeDayController extends Controller
{
	private $user, $settings;

	function __construct(Model $factory)
	{
		parent::__construct($factory);
		$this->user = UserSession::getUser($this->factory);
	}

	/**
	* @Route(name=usereditday|route=/edit/day)
	*/
	public function indexAction()
	{
		$this->checkAccess();
		$form = $this->createForm("UserEditDayForm", $this->user);
		$weeks = $this->factory->findOneBy("B7KP\Entity\Week", $this->user->id, "iduser");
		$var = array("form" => $form, "weeks" => count($weeks));
		$this->render("editday.php", $var);
	}

	protected function checkAccess()
	{
		if(!$this->user instanceof User)
		{
			$this->redirectToRoute("login");
		}
		$this->settings = $this->factory->findOneBy("B7KP\Entity\Settings", $this->user->id, "iduser");
	}

	/**
	* @Route(name=edit_profile|route=/check/profile/edit)
	*/
	public function checkEdit()
	{
		$post = (object)$_POST;
		if($this->isAjaxRequest())
		{
			$post->id = $this->settings->id;
			if($this->checkAssert($post))
			{
				$affected = $this->factory->update("B7KP\Entity\Settings", $post);
				if($affected)
				{
					$response = array("erro" => 0, "message" => "Success", "call" => "goTo", "url" => Route::url("usereditday"));
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
		$assert->check("\B7KP\Entity\Settings", $post, false);
		$this->assertErrors = $assert->getErrors();

		return count($this->assertErrors)==0;
	}
}
?>