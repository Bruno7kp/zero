<?php
namespace B7KP\Controller;

use B7KP\Model\Model;
use B7KP\Utils\UserSession;
use B7KP\Library\Assert;
use B7KP\Library\Route;
use B7KP\Library\Lang;
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
	* @Route(name=cert_settings|route=/certification)
	*/
	public function certAction()
	{
		$this->checkAccess();
		$form = $this->createForm("CertForm", $this->settings);
		$vars = array("form" => $form, "field" => Lang::get("cert"));
		$this->render("edit.php", $vars);
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
				$post = $this->correctValues($post);
				$url = isset($post->show_cert) ? Route::url("cert_settings") : Route::url("settings");
				if($this->settings)
				{
					$post->id = $this->settings->id;
					$updated = $this->factory->update("B7KP\Entity\Settings", $post);
					if($updated)
					{
						$response = array("erro" => 0, "message" => "Success", "call" => "goTo", "url" => $url);
					}
					else
					{
						$response = array("erro" => 1, "message" => "Oops, something went wrong");
					}
				}
				else
				{
					$post->iduser = $this->user->id;
					$rest = Settings::getAllDefaults($this->user->login);
					foreach ($rest as $key => $value) 
					{
						if(!isset($post->$key))
						{
							$post->$key = $value;
						}
					}
					$id = $this->factory->add("B7KP\Entity\Settings", $post);
					if($id > 0)
					{
						$response = array("erro" => 0, "message" => "Success", "call" => "goTo", "url" => $url);
					}
					else
					{
						$response = array("erro" => 1, "message" => "Oops, something went wrong.");
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

	private function correctValues($post)
	{
		if(isset($post->show_cert) && $post->show_cert == 0)
		{
			$post->show_chart_cert = 0;
			$post->show_plaque = 0;
		}

		return $post;
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