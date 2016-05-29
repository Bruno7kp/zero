<?php
namespace B7KP\Controller;

use B7KP\Model\Model;
use B7KP\Utils\UserSession;
use B7KP\Library\Assert;
use B7KP\Library\Route;
use B7KP\Entity\User;
use B7KP\Entity\Settings;

class SettingsController extends Controller
{
	private $settings;
	private $user;

	function __construct(Model $factory)
	{
		parent::__construct($factory);
		$this->user = UserSession::getUser($this->factory);
		$this->settings = $this->factory->findOneBy("B7KP\Entity\Settings", $this->user->id, "iduser");
	}

	/**
	* @Route(name=settings|route=/settings)
	*/
	public function indexAction()
	{
		$this->checkAccess();
		$form = $this->createForm("SettingsForm", $this->settings);
		$vars = array("form" => $form);
		$this->render("settings.php", $vars);
	}

	/**
	* @Route(name=change_settings|route=/check/settings)
	*/
	public function changeSettings()
	{
		$post = (object)$_POST;
		if($this->isAjaxRequest())
		{
			$post->id = $this->user->id;
			if($this->checkAssert($post))
			{
				if($this->settings)
				{
					$post->id = $this->settings->id;
					$updated = $this->factory->update("B7KP\Entity\Settings", $post);
					if($updated)
					{
						$response = array("erro" => 0, "message" => "Success", "call" => "goTo", "url" => Route::url("settings"));
					}
					else
					{
						$response = array("erro" => 1, "message" => "Oops, something went wrong");
					}
				}
				else
				{
					$post->iduser = $this->user->id;
					$id = $this->factory->add("B7KP\Entity\Settings", $post);
					if($id > 0)
					{
						$response = array("erro" => 0, "message" => "Success", "call" => "goTo", "url" => Route::url("settings"));
					}
					else
					{
						$response = array("erro" => 1, "message" => "Oops, something went wrong");
					}
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
			$this->redirectToRoute("settings");
		}
	}

	private function checkAssert($post)
	{
		$assert = new Assert();
		$assert->check("\B7KP\Entity\Settings", $post, false);
		$this->assertErrors = $assert->getErrors();

		return count($this->assertErrors)==0;
	}

	protected function checkAccess()
	{
		if(!$this->user instanceof User)
		{
			$this->redirectToRoute("login");
		}
	}
}
?>