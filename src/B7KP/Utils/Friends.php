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
				if($r["to"] == $this->user_session->id)
				{
					if($this->acceptFriend($r["id"]))
					{
						return 2;
					}
				}
			}
			else
			{
				$data = new \stdClass();
				$data->iduser_one = $this->user_session->id;
				$data->iduser_two = $user->id;
				$data->accepted = 0;
				$data->notified = 0;
				if($this->factory->add("B7KP\Entity\Friend", $data))
				{
					return 1;
				}
			}
		}
		return 0;
	}

	public function removeFriend(User $user)
	{
		if($this->user_session)
		{
			$vars_one = array("iduser_one" => $this->user_session->id, "iduser_two" => $user->id);
			$vars_two = array("iduser_two" => $this->user_session->id, "iduser_one" => $user->id);
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

	private function read($acc)
	{
		if(!$acc->notified)
		{
			$acc->notified();
			$this->factory->update("B7KP\Entity\Friend", $acc);
		}
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
			foreach ($by_one as $key => $value) 
			{
				$get = $this->factory->findOneBy("B7KP\Entity\User", $value->iduser_two);
				if($get)
				{
					$friends[] = $get;
				}
			}
		}
		if(isset($by_two[0]))
		{
			foreach ($by_two as $key => $value) 
			{
				$get = $this->factory->findOneBy("B7KP\Entity\User", $value->iduser_one);
				if($get)
				{
					$friends[] = $get;
				}
			}
		}

		return $friends;
	}

	public function getNewFriends($markAsRead = false)
	{
		if($this->user_session)
		{
			$vars_one = array("iduser_one" => $this->user_session->id, "accepted" => 1, "notified" => 0);
			$by_one = $this->factory->find("B7KP\Entity\Friend", $vars_one);
			if($markAsRead)
			{
				foreach ($by_one as $key => $value) 
				{
					$this->read($value);
				}
			}
			return $by_one;
		}
		return false;
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
				return array("response" => true, "id" => $by_one[0]->id, "button" => "wait", "by" => $this->user_session->id, "to" => $user->id);
			}
			if(isset($by_two[0]))
			{
				return array("response" => true, "id" => $by_two[0]->id, "button" => "accept", "to" => $this->user_session->id, "by" => $user->id);
			}
		}
		return array("response" => false);
	}
}
?>