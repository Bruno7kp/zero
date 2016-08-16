<?php 
namespace B7KP\Utils;

use B7KP\Model\Model;
use B7KP\Core\Dao;
use B7KP\Entity\User;
use B7KP\Entity\Settings;
use B7KP\Entity\Friend;
use B7KP\Library\Lang;
use B7KP\Library\Url;

class Friends
{
	private $user_session;
	
	function __construct(Model $factory)
	{
		$this->factory = $factory;
		$this->user_session = UserSession::getUser($this->factory);
	}

	public function addFriend(User $user)
	{
		if($this->user_session)
		{
			$r = $this->hasRequest($user);
			if($r["response"])
			{
				$this->acceptFriend($r["id"]);
			}
		}
		return false;
	}

	public function removeFriend(User $user)
	{
		if($this->user_session)
		{
			$vars_one = array("iduser_one" => $this->user_session->id, "iduser_two" => $user->id, "accepted" => 1);
			$vars_two = array("iduser_two" => $this->user_session->id, "iduser_one" => $user->id, "accepted" => 1);
			$by_one = $this->factory->find("B7KP\Entity\Friend", $vars_one);
			$by_two = $this->factory->find("B7KP\Entity\Friend", $vars_two);
			if(isset($by_one[0]))
			{
				return $this->factory->remove("B7KP\Entity\Friend", $by_one[0]->id);
			}
			else if(isset($by_two[0]))
			{
				return $this->factory->remove("B7KP\Entity\Friend", $by_two[0]->id);
			}
		}
		return false;
	}

	private function acceptFriend($id)
	{
		$acc = $this->factory->findOneBy("B7KP\Entity\Friend", $id);
		$acc->accept();
		return $this->factory->update("B7KP\Entity\Friend", $acc);
	}

	public function getFriends(User $user)
	{
		$vars_one = array("iduser_one" => $user->id, "accepted" => 1);
		$vars_two = array("iduser_two" => $user->id, "accepted" => 1);
		$by_one = $this->factory->find("B7KP\Entity\Friend", $vars_one);
		$by_two = $this->factory->find("B7KP\Entity\Friend", $vars_two);
		$friends = array();
		if(isset($by_one[0]))
		{
			foreach ($variable as $key => $value) {
				$friends[] = $this->factory->findOneBy("B7KP\Entity\User", $value->iduser_two);
			}
		}
		if(isset($by_two[0]))
		{
			foreach ($variable as $key => $value) {
				$friends[] = $this->factory->findOneBy("B7KP\Entity\User", $value->iduser_one);
			}
		}

		return $friends;
	}

	public function isFriend(User $user)
	{
		if($this->user_session)
		{
			$vars_one = array("iduser_one" => $this->user_session->id, "iduser_two" => $user->id, "accepted" => 1);
			$vars_two = array("iduser_two" => $this->user_session->id, "iduser_one" => $user->id, "accepted" => 1);
			$by_one = $this->factory->find("B7KP\Entity\Friend", $vars_one);
			$by_two = $this->factory->find("B7KP\Entity\Friend", $vars_two);
			return isset($by_two[0]) || isset($by_one[0]);
		}
		return false;
	}

	public function getRequests()
	{
		if($this->user_session)
		{
			$vars_two = array("iduser_two" => $this->user_session->id, "accepted" => 0);
			$by_two = $this->factory->find("B7KP\Entity\Friend", $vars_two);
			if(count($by_two) > 0)
			{
				return $by_two;
			}
		}
		return false;
	}

	public function hasRequest(User $user)
	{
		if($this->user_session)
		{
			$vars_one = array("iduser_one" => $this->user_session->id, "iduser_two" => $user->id, "accepted" => 0);
			$vars_two = array("iduser_two" => $this->user_session->id, "iduser_one" => $user->id, "accepted" => 0);
			$by_one = $this->factory->find("B7KP\Entity\Friend", $vars_one);
			$by_two = $this->factory->find("B7KP\Entity\Friend", $vars_two);
			if(isset($by_one[0]))
			{
				return array("response" => true, "id" => $by_one[0]->id, "button" => "wait");
			}
			if(isset($by_two[0]))
			{
				return array("response" => true, "id" => $by_two[0]->id, "button" => "accept");
			}
		}
		return array("response" => false);
	}
}
?>