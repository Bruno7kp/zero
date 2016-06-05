<?php
namespace B7KP\Controller;

use B7KP\Model\Model;
use B7KP\Utils\UserSession;
use B7KP\Utils\Login;
use B7KP\Utils\Pass;
use B7KP\Library\Route;
use B7KP\Library\Lang;
use B7KP\Entity\User;

class UpdatePassController extends Controller
{
	private $user;

	function __construct(Model $factory)
	{
		parent::__construct($factory);
		$this->user = UserSession::getUser($this->factory);
	}

	/**
	* @Route(name=usereditpass|route=/edit/password)
	*/
	public function indexAction()
	{
		$this->checkAccess();
		$form = $this->createForm("UserEditFormPass", $this->user);
		$var = array("form" => $form, "field" => Lang::get('pass'));
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
	* @Route(name=edit_profile_pass|route=/check/pass/edit)
	*/
	public function checkEdit()
	{
		$post = (object)$_POST;
		//var_dump($post);
		if($this->isAjaxRequest())
		{
			$post->id = $this->user->id;
			if($this->checkNewPass($post))
			{
				$response = array("erro" => 0, "message" => "Ok","call" => "successAndGoTo", "url" => Route::url("usereditpass"));
			}
			else
			{
				$response = array("erro" => 1, "message" => $this->passError);
			}
			echo json_encode($response);
		}
		else
		{
			$this->redirectToRoute("home");
		}
	}

	private function checkNewPass($post)
	{
		$return = false;
		$login = new Login($this->user->login, $post->old_pass, $this->factory);
		if($login->login())
		{
			if(strlen($post->new_pass) >= 4 && strlen($post->new_pass) <= 20)
			{
				if(strpos(mb_strtolower($post->new_pass), mb_strtolower($this->user->login)) === false)
				{

					if($post->new_pass == $post->new_pass_repeat)
					{
						$data = new \stdClass();
						$data->password = Pass::encrypt($post->new_pass);
						$data->id = $this->user->id;
						$affected = $this->factory->update("\B7KP\Entity\User", $data);
						if($affected)
						{
							$return = true;
						}
						else
						{
							$this->passError = Lang::get("fail_update");
						}
					}
					else
					{
						$this->passError = Lang::get("pass_dont_match");
					}
				}
				else
				{
					$this->passError = Lang::get("not_contain");
				}
			}
			else
			{
				$this->passError = Lang::get("min_max_login");
			}
		}
		else
		{
			$this->passError = Lang::get("invalid_login");
		}

		return $return;
	}
}
?>