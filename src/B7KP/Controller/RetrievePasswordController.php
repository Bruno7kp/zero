<?php
namespace B7KP\Controller;

use B7KP\Model\Model;
use B7KP\Utils\UserSession;
use B7KP\Utils\Login;
use B7KP\Utils\Pass;
use B7KP\Library\Route;
use B7KP\Library\Lang;
use B7KP\Entity\User;
use LastFmApi\Main\LastFm;

class RetrievePasswordController extends Controller
{
	private $user;

	function __construct(Model $factory)
	{
		parent::__construct($factory);
		$this->user = UserSession::getUser($this->factory);
	}

	/**
	* @Route(name=forgotpass|route=/forgotpass)
	*/
	public function indexAction()
	{
		$var = array();
		$this->checkAccess();
		$var["error"] = 0;
		$get = (object)$_GET;
		if(isset($get->user))
		{
			$user = $this->factory->findOneBy("B7KP\Entity\User", $get->user, "login");
			$var["user"] = $user;
			if($user instanceof User)
			{
				if(isset($get->token))
				{
					$lfm_u = $this->checkToken($get->token);
					if(!is_null($lfm_u) && $lfm_u == $user->login)
					{
						$form = $this->createForm("UserRenewPassForm", $get);
						$var["form"] = $form;
					}
					else
					{
						$var["error"] = 2;
					}
				}
				else
				{
					$var["form"] = false;
				}
			}
			else
			{
				$var["error"] = 1;
			}
		}
		else
		{
			$form = $this->createForm("UserRetrieveForm", $get);
			$var["form"] = $form;
		}
		$this->render("forgotpass.php", $var);
	}

	protected function checkAccess()
	{
		if($this->user instanceof User)
		{
			$this->redirectToRoute("home");
		}
	}

	/**
	* @Route(name=renew_profile_pass|route=/check/pass/renew)
	*/
	public function checkEdit()
	{
		$post = (object)$_POST;
		//var_dump($post);
		if($this->isAjaxRequest())
		{
			if($this->checkNewPass($post))
			{
				$response = array("erro" => 0, "message" => "Ok","call" => "successAndGoTo", "url" => Route::url("login"));
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

	/**
	* return = username or null
	*/
	private function checkToken($token)
	{
		$lfm = new LastFm();
		return $lfm->setToken($token);
	}

	private function checkNewPass($post)
	{
		$return = false;
		$user = $this->factory->findOneBy("B7KP\Entity\User", $post->user, "login");
		if($user instanceof User)
		{
			if(strlen($post->new_pass) >= 4 && strlen($post->new_pass) <= 20)
			{
				if(strpos(mb_strtolower($post->new_pass), mb_strtolower($user->login)) === false)
				{
					if($post->new_pass == $post->new_pass_repeat)
					{
						$data = new \stdClass();
						$data->password = Pass::encrypt($post->new_pass);
						$data->id = $user->id;
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