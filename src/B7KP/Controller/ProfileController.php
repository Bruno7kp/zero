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

class ProfileController extends Controller
{
	
	function __construct(Model $factory)
	{
		parent::__construct($factory);
	}

	/**
	* @Route(name=profile|route=/user/{login})
	*/
	public function profileAction($login)
	{
		$user = $this->factory->findOneBy("B7KP\Entity\User", $login, "login");
		if($user instanceof User)
		{
			$settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
			$startday = $settings->start_day ? "friday" : "sunday";
			
			if($user->lfm_register){
				$date = new \DateTime($user->lfm_register);
				$date = $date->format("Y.m.d");
			}else{
				$lfm 	= new LastFm();
				$last 	= $lfm->setUser($user->login)->setStartDate($startday)->getUserInfo();
				$date 	= \DateTime::createFromFormat("U",$last['registered'])->format("Y.m.d");
				$dateuser 	= \DateTime::createFromFormat("U",$last['registered'])->format("Y-m-d");
				$data = new \stdClass();
				$data->lfm_register = $dateuser;
				$data->id = $user->id;
				$this->factory->update("\B7KP\Entity\User", $data);
			}		
			$average = 0;
			$weeks 	= $this->factory->find("B7KP\Entity\Week", array("iduser" => $user->id), "week DESC");
			if(count($weeks) > 0){
				$lastwk = $weeks[0];
				$to = new \DateTime($lastwk->to_day);
				$now = new \DateTime();
				$diff = $to->diff($now);
				$wksfm = count($weeks) + floor($diff->days / 7);
			}else{
				$wksfm = 0;
			}
			$bgimage = false;
			$topartist = false;

			$user_session = UserSession::getUser($this->factory);
			$add_friend = "";
			# Se está logado, e na página de outro usuário
			if($user_session && $user->id != $user_session->id)
			{
				$friend = new Friends($this->factory);
				$add_friend = Snippets::friendsButton("add", $user->id, Lang::get("friend_add"));
				# Se já é amigo, pode remover
				if($friend->isFriend($user))
				{
					$add_friend = Snippets::friendsButton("remove", $user->id, Lang::get("friend_remove"));
				}
				else
				{
					# Se ainda não é, verifica se o pedido já foi feito
					$resp = $friend->hasRequest($user);
					if($resp["response"])
					{
						# Se o usuário já pediu
						if($resp["button"] == "wait")
						{
							$add_friend = Snippets::friendsButton("wait", $user->id, Lang::get("friend_wait"));
						}
					}
					# Se ainda não pediu, ou o outro usuário já pediu, mostra o botão para adicionar
				}
			}
			$perm = new \B7KP\Utils\PermissionCheck("User");
			$visibility = $perm->viewPermission($user, $this->factory, $settings->visibility);
			$var = array
					(
						"user" 			=> $user,
						"lfm_href" 		=> "https://www.last.fm/user/".$user->login,
						"lfm_image" 	=> "/web/img/default-art.png",
						"lfm_playcount" => 0,
						"lfm_country" 	=> null,
						"lfm_bg" 		=> $bgimage,
						"lfm_register"	=> $date,
						"weeks" 		=> $weeks,
						"weekstodate"	=> $wksfm,
						"topartist"		=> $topartist,
						"average"		=> round($average),
						"add_friend"	=> $add_friend,
						"visibility"	=> $visibility
					);
			if($visibility === false)
			{
				unset($var["lfm_bg"]);
			}
			$this->render("profile.php", $var);
		}
		else
		{
			$this->redirectToRoute("registernotfound", array("entity" => "user"));
		}
	}

	/**
	* @Route(name=userprofile|route=/profile)
	*/
	public function indexAction()
	{
		$this->checkAccess();
		$user = UserSession::getUser($this->factory);
		$this->redirectToRoute("profile", array("login" => $user->login));
	}

	/**
	* @Route(name=load_all|route=/load_all/{login}/{limit})
	*/
	public function loadAll($login, $limit)
	{
		$all = array();
		ob_start();
		$this->artTopList($login, $limit);
		$all['artist'] = ob_get_clean();
		ob_start();
		$this->musTopList($login, $limit);
		$all['music'] = ob_get_clean();
		ob_start();
		$this->albTopList($login, $limit);
		$all['album'] = ob_get_clean();
		ob_start();
		$this->recentList($login, $limit);
		$all['recent'] = ob_get_clean();
		echo json_encode($all);
	}	

	/**
	* @Route(name=art_top_list|route=/art_top_list/{login}/{limit})
	*/
	public function artTopList($login, $limit)
	{
		if($this->isAjaxRequest())
		{
			$user = $this->factory->findOneBy("B7KP\Entity\User", $login, "login");
			$lfm 	= new LastFm();
			$last 	= $lfm->setUser($user->login);
			$lfm_topacts 	= $lfm->getUserTopArtist(array("limit" => (int)$limit, "period" => "overall"));

			if (is_array($lfm_topacts) && count($lfm_topacts) > 1) 
			{
				unset($lfm_topacts["info"]);
				$html = "";
				foreach ($lfm_topacts as $act) 
				{
					$html .= Snippets::topActListRow($act['name'], $act['url'], $act['playcount'], $act['images']['medium'], $lfm_topacts[0]['playcount'], $user->login);
				}
				$html .= "<a href='".Route::url('lib_art_list', array('login' => $login))."' class='btn btn-info btn-block btn-sm'>".Lang::get('view')."</a>";
				echo $html;
			}
			else
			{
				echo Lang::get('not_show');
			}

		}
		else
		{
			$this->redirectToRoute("home");
		}
	}

	/**
	* @Route(name=alb_top_list|route=/alb_top_list/{login}/{limit})
	*/
	public function albTopList($login, $limit)
	{
		if($this->isAjaxRequest())
		{
			$user = $this->factory->findOneBy("B7KP\Entity\User", $login, "login");
			$lfm 	= new LastFm();
			$last 	= $lfm->setUser($user->login);
			$lfm_topalbs 	= $lfm->getUserTopAlbum(array("limit" => (int)$limit, "period" => "overall"));
			if (is_array($lfm_topalbs) && count($lfm_topalbs) > 1) 
			{
				unset($lfm_topalbs["info"]);
				$html = "";
				foreach ($lfm_topalbs as $alb) 
				{
					$html .= Snippets::topAlbListRow($alb['name'], $alb['url'], $alb['playcount'], $alb['images']['medium'], $lfm_topalbs[0]['playcount'], $alb['artist']['name'], $alb['artist']['url'], $user->login);
				}
				$html .= "<a href='".Route::url('lib_alb_list', array('login' => $login))."' class='btn btn-info btn-block btn-sm'>".Lang::get('view')."</a>";
				echo $html;
			}
			else
			{
				echo Lang::get('not_show');
			}
		}
		else
		{
			$this->redirectToRoute("home");
		}
	}

	/**
	* @Route(name=mus_top_list|route=/mus_top_list/{login}/{limit})
	*/
	public function musTopList($login, $limit)
	{
		if($this->isAjaxRequest())
		{
			$user = $this->factory->findOneBy("B7KP\Entity\User", $login, "login");
			$lfm 	= new LastFm();
			$last 	= $lfm->setUser($user->login);
			$lfm_topmus 	= $lfm->getUserTopMusic(array("limit" => (int)$limit, "period" => "overall"));
			if (is_array($lfm_topmus) && count($lfm_topmus) > 1) 
			{
				unset($lfm_topmus["info"]);
				$html = "";
				foreach ($lfm_topmus as $mus) 
				{
					$html .= Snippets::topMusListRow($mus['name'], $mus['url'], $mus['playcount'], $mus['images']['medium'], $lfm_topmus[0]['playcount'], $mus['artist']['name'], $mus['artist']['url'], null, null, $user->login);
				}
				$html .= "<a href='".Route::url('lib_mus_list', array('login' => $login))."' class='btn btn-info btn-block btn-sm'>".Lang::get('view')."</a>";
				echo $html;
			}
			else
			{
				echo Lang::get('not_show');
			}

		}
		else
		{
			$this->redirectToRoute("home");
		}
	}

	/**
	* @Route(name=recent_list|route=/recent_list/{login}/{limit})
	*/
	public function recentList($login, $limit)
	{
		if($this->isAjaxRequest())
		{
			$user = $this->factory->findOneBy("B7KP\Entity\User", $login, "login");
			$lfm 	= new LastFm();
			$last 	= $lfm->setUser($user->login);
			$recent = $lfm->getRecentTrack();
			if(is_array($recent) && count($recent) > 0)
			{
				$html = "<div class='bottomspace-sm topspace-sm'><h2 class='h3'>".Lang::get('rec_tra')."</h2></div>";
				foreach ($recent as $key => $value) 
				{
					$html .= Snippets::recentListRow($value['name'], $value['images']['medium'], $value['artist']['name'], $value['album']['name'], $value['url'], $login);
				}
				$html .= "<a class='btn btn-danger btn-block topspace-sm' target='_blank' href='http://last.fm/user/{$user->login}/library'>".Lang::get('view')." <i class='fa fa-lastfm'></i></a>";
				echo $html;
			}
			else
			{
				echo Lang::get('not_show');
			}
		}
		else
		{
			$this->redirectToRoute("home");
		}
	}

	protected function checkAccess()
	{
		if(UserSession::getUser($this->factory) == false)
		{
			$this->redirectToRoute("login");
		}
	}
}
?>