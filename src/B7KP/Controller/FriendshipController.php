<?php
namespace B7KP\Controller;

use B7KP\Model\Model;
use B7KP\Utils\UserSession;
use B7KP\Utils\Snippets;
use B7KP\Utils\Friends;
use B7KP\Entity\User;
use B7KP\Library\Lang;
use B7KP\Library\Route;
use LastFmApi\Main\LastFm;

class FriendshipController extends Controller
{

	protected $control;
	
	function __construct(Model $factory)
	{
		parent::__construct($factory);
		$this->checkAccess();
		$this->control = new Friends($factory);
	}

	/**
	* @Route(name=add_friend|route=/check/add_friend/{id})
	*/
	public function addAction($id)
	{
		if($this->isAjaxRequest())
		{
			$user = $this->checkId($id);
			$resp = $this->control->addFriend($user);
			switch ($resp) 
			{
				case 1:
					$e = 0;
					$m = Lang::get("friend_request");
					$b = Snippets::friendsButton("wait", $user->id, Lang::get("friend_wait"));
					break;

				case 2:
					$e = 0;
					$m = Lang::get("friend_accept");
					$b = Snippets::friendsButton("remove", $user->id, Lang::get("friend_remove"));
					break;
				
				default:
					$e = 1;
					$m = Lang::get("fail_action");
					$b = false;
					break;
			}

			echo json_encode(array("error" => $e, "msg" => $m, "btn" => $b));
		}
		else
		{
			$this->redirectToRoute("home");
		}
	}

	/**
	* @Route(name=remove_friend|route=/check/remove_friend/{id})
	*/
	public function removeAction($id)
	{
		if($this->isAjaxRequest())
		{
			$user = $this->checkId($id);
			if($this->control->removeFriend($user))
			{
				$e = 0;
				$m = Lang::get("friend_removed");
				$b = Snippets::friendsButton("add", $user->id, Lang::get("friend_add"));
			}
			else
			{
				$e = 1;
				$m = Lang::get("not_possible");
				$b = false;
			}

			echo json_encode(array("error" => $e, "msg" => $m, "btn" => $b));
		}
		else
		{
			$this->redirectToRoute("home");
		}
	}

	/**
	* @Route(name=need_login|route=/check/need_login)
	*/
	public function loginNeeded()
	{
		if($this->isAjaxRequest())
		{
			echo json_encode(array("error" => 1, "msg" => Lang::get("need_login")));
		}
		else
		{
			$this->redirectToRoute("home");
		}
	}

	/**
	* @Route(name=fail_action|route=/check/fail_action)
	*/
	public function failAdd()
	{
		if($this->isAjaxRequest())
		{
			echo json_encode(array("error" => 1, "msg" => Lang::get("fail_action")));
		}
		else
		{
			$this->redirectToRoute("home");
		}
	}


	protected function checkId($id)
	{
		$user = $this->factory->findOneBy("B7KP\Entity\User", $id);
		if($user)
		{
			return $user;
		}
		else
		{
			$this->redirectToRoute("fail_action");
		}
	}

	protected function checkAccess()
	{
		$this->user_session = UserSession::getUser($this->factory);
		if($this->user_session == false)
		{
			$this->redirectToRoute("need_login");
		}
	}
}
?>