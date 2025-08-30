<?php
namespace B7KP\Controller;

use B7KP\Core\Dao;
use B7KP\Entity\Settings;
use B7KP\Entity\User;
use B7KP\Entity\Week;
use B7KP\Model\Model;
use B7KP\Utils\Certified;
use B7KP\Utils\Charts;
use B7KP\Utils\UserSession;
use LastFmApi\Main\LastFm;
use B7KP\Utils\Snippets;

class ChartController extends Controller
{

    public function __construct(Model $factory)
    {
        parent::__construct($factory);
    }

    /**
     * @Route(name=chart_list|route=/user/{login}/charts)
     */
    public function chartsIndex($login)
    {
        $user = $this->factory->findOneBy("B7KP\Entity\User", $login, "login");
        if ($user instanceof User) {
            $settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
            $perm = new \B7KP\Utils\PermissionCheck("User");
            $visibility = $perm->viewPermission($user, $this->factory, $settings->visibility);
            if (!$visibility) {
                $this->redirectToRoute("profile", array("login" => $user->login));
            }
            $lfm = new LastFm();
            //$last = $lfm->setUser($user->login)->getUserInfo();
            //$acts     = $lfm->getUserTopArtist(array("limit" => 1, "period" => "overall"));
            $bgimage = false;
            $acts = array();
            if (isset($acts[0])):
                $bgimage = $acts[0]["images"]["mega"];
            endif;
            $numberones = array();
            $cond = array("iduser" => $user->id);
            $weeks = $this->factory->find("B7KP\Entity\Week", $cond, "week DESC", "0, 5");
            $i = 0;
            foreach ($weeks as $week) {
                $numberones[$i]["week"] = $week->week;
                $from = new \DateTime($week->from_day);
                $numberones[$i]["from"] = $from->format("Y.m.d");
                $to = new \DateTime($week->to_day);
                $to->modify('-1 day');
                $numberones[$i]["to"] = $to->format("Y.m.d");
                $cond = array("idweek" => $week->id);
                $numberones[$i]["album"] = $this->factory->find("B7KP\Entity\Album_charts", $cond, "updated DESC, rank ASC", "0, 1");
                $numberones[$i]["artist"] = $this->factory->find("B7KP\Entity\Artist_charts", $cond, "updated DESC, rank ASC", "0, 1");
                $numberones[$i]["music"] = $this->factory->find("B7KP\Entity\Music_charts", $cond, "updated DESC, rank ASC", "0, 1");
                $i++;
            }
            $numberonesy = array();
            $cond = array("iduser" => $user->id);
            $years = $this->factory->find("B7KP\Entity\Yec", $cond, "year DESC LIMIT 0,1");
            $i = 0;
            foreach ($years as $year) {
                $numberonesy[$i]["year"] = $year->year;
                $cond = array("idyec" => $year->id);
                $numberonesy[$i]["album"] = $this->factory->find("B7KP\Entity\\Album_yec", $cond, "updated DESC, rank ASC", "0, 1");
                $numberonesy[$i]["artist"] = $this->factory->find("B7KP\Entity\\Artist_yec", $cond, "updated DESC, rank ASC", "0, 1");
                $numberonesy[$i]["music"] = $this->factory->find("B7KP\Entity\\Music_yec", $cond, "updated DESC, rank ASC", "0, 1");
                $i++;
            }
            // get yecs no. 1s
            $var = array
                (
                "weeks" => $numberones,
                "years" => $numberonesy,
                "settings" => $settings,
                "user" => $user,
                "lfm_bg" => $bgimage,
                "lfm_image" => "/web/img/default-art.png",
            );
            $this->render("mainchart.php", $var);
        } else {
            $this->redirectToRoute("registernotfound", array("entity" => "user"));
        }
    }

    /**
     * @Route(name=full_chart_list|route=/user/{login}/charts/list/)
     */
    public function fullChartsRedirect($login)
    {
        $this->redirectToRoute("full_charts_list", array("login" => $login, "type" => "artist"));
    }

    /**
     * @Route(name=get_chartrun|route=/ajax/chartrun/{weekstart}/{weekend}/{type}/{user}/{name}/{artist})
     */
    public function getChartRun($weekstart, $weekend, $type, $user, $name, $artist = null)
    {
        // Busca o usuário
        $userObj = $this->factory->findOneBy("B7KP\Entity\User", $user, "login");
        if (!$userObj) {
            echo json_encode(["error" => "User not found"]);
            return;
        }
        if ($weekstart === "first") {
            $weekstart = 1;
        } else {
            $weekstart = intval($weekstart);
        }
        $weekop = $this->factory->find("B7KP\Entity\Week", array("iduser" => $userObj->id, "week" => $weekstart), "week DESC");
        if ($weekend === "last") {
            $lastWeek = $this->factory->findOneBy("B7KP\Entity\Week", $userObj->id, "iduser", "week DESC");
            if ($lastWeek) {
                $weeked = [$lastWeek->week];
            } else {
                echo json_encode(["error" => "Week not found"]);
                return;
            }
        } else {
            $weekend = intval($weekend);
            $weeked = $this->factory->find("B7KP\Entity\Week", array("iduser" => $userObj->id, "week" => $weekend), "week DESC");
        }
                
        if (is_array($weekop) && count($weekop) > 0) {
				$weekop = $weekop[0];
        } else {
            echo json_encode(["error" => "Week not found"]);
            return;
        }
        if (is_array($weeked) && count($weeked) > 0) {
				$weeked = $weeked[0];
        } else {
            echo json_encode(["error" => "Week not found"]);
            return;
        }

        // Busca o settings do usuário
        $settings = $this->factory->findOneBy("B7KP\Entity\Settings", $userObj->id, "iduser");
        if (!$settings) {
            $settings = new \B7KP\Entity\Settings();
        }

        // Define o limite conforme o tipo
        switch ($type) {
            case "artist":
                $limit = $settings->art_limit;
                break;
            case "album":
                $limit = $settings->alb_limit;
                break;
            case "music":
                $limit = $settings->mus_limit;
                break;
            default:
                $limit = 50;
        }

        $chart = new \B7KP\Utils\Charts($this->factory, $userObj);

        // Corrige os nomes recebidos na URL
        $fixedName = urldecode($name);
        $fixedName = str_replace("+", " ", $fixedName);
        $fixedName = str_replace("%2b", "+", $fixedName);
        $fixedName = str_replace("%2f", "/", $fixedName);
        $fixedName = str_replace("%5c", "\\", $fixedName);

        $fixedArtist = $artist;
        if ($type !== "artist" && $artist !== null) {
            $fixedArtist = urldecode($artist);
            $fixedArtist = str_replace("+", " ", $fixedArtist);
            $fixedArtist = str_replace("%2b", "+", $fixedArtist);
            $fixedArtist = str_replace("%2f", "/", $fixedArtist);
            $fixedArtist = str_replace("%5c", "\\", $fixedArtist);
        }

        // Busca os dados necessários para o chart run
        switch ($type) {
            case "artist":
                $stats = $chart->getArtistStats($fixedName, "");
                if (count($stats)) {
                    $fixedName = $stats[0]->artist;
                }
                $extracted = $chart->extract($stats, false, $weeked->week, $weekop->week);
                $chartrun = $extracted["chartrun"];
                $alltime = $extracted["stats"]["todate"];
                break;
            case "album":
                $stats = $chart->getAlbumStats($fixedName, $fixedArtist, "");
                if (count($stats)) {
                    $fixedName = $stats[0]->album;
                    $fixedArtist = $stats[0]->artist;
                }
                $extracted = $chart->extract($stats, false, $weeked->week, $weekop->week);
                $chartrun = $extracted["chartrun"];
                $alltime = $extracted["stats"]["todate"];
                break;
            case "music":
                $stats = $chart->getMusicStats($fixedName, $fixedArtist, "");
                if (count($stats)) {
                    $fixedName = $stats[0]->music;
                    $fixedArtist = $stats[0]->artist;
                }
                $extracted = $chart->extract($stats, false, $weeked->week, $weekop->week);
                $chartrun = $extracted["chartrun"];
                $alltime = $extracted["stats"]["todate"];
                break;
            default:
                echo json_encode(["error" => "Invalid type"]);
                return;
        }

        // Gera o HTML do chart run
        ob_start();
        echo \B7KP\Utils\Snippets::chartRun($type, $chartrun, $userObj, $alltime, $limit, $fixedName, $fixedArtist);
        $cr = ob_get_clean();

        echo json_encode(["cr" => $cr]);
    }

    /**
     * @Route(name=full_charts_list|route=/user/{login}/charts/list/{type})
     */
    public function fullCharts($login, $type)
    {
        $user = $this->factory->findOneBy("B7KP\Entity\User", $login, "login");
        if ($user instanceof User) {
            $this->isValidType($type, $user);
            $perm = new \B7KP\Utils\PermissionCheck("User");
            $settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
            $visibility = $perm->viewPermission($user, $this->factory, $settings->visibility);
            if (!$visibility) {
                $this->redirectToRoute("profile", array("login" => $user->login));
            }
            $bgimage = $this->getUserBg($user);
            $numberones = array();
            $cond = array("iduser" => $user->id);
            $weeks = $this->factory->find("B7KP\Entity\Week", $cond, "week DESC");
            $i = 0;
            foreach ($weeks as $week) {
                $numberones[$i]["week"] = $week->week;
                $from = new \DateTime($week->from_day);
                $numberones[$i]["from"] = $from->format("Y.m.d");
                $to = new \DateTime($week->to_day);
                $to->modify('-1 day');
                $numberones[$i]["to"] = $to->format("Y.m.d");
                $cond = array("idweek" => $week->id);
                $numberones[$i]["album"] = array();
                $numberones[$i]["artist"] = array();
                $numberones[$i]["music"] = array();
                $numberones[$i][$type] = $this->factory->find("B7KP\Entity\\" . ucfirst($type) . "_charts", $cond, "updated DESC, rank ASC", "0, 1");
                $i++;
            }
            $var = array
                (
                "weeks" => $numberones,
                "user" => $user,
                "lfm_bg" => $bgimage,
                "lfm_image" => $this->getUserBg($user, true),
                "type" => $type,
            );
            $this->render("chartlist.php", $var);
        } else {
            $this->redirectToRoute("registernotfound", array("entity" => "user"));
        }
    }

    /**
     * @Route(name=weekly_chart|route=/user/{login}/charts/{type}/week/{week})
     */
    public function weeklyChart($login, $type, $week)
    {
        $user = $this->isValidUser($login);
        $this->isValidType($type, $user);
        if (is_numeric($week)) {
			$settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
            $week = $this->factory->find("B7KP\Entity\Week", array("iduser" => $user->id, "week" => $week), "week DESC");
            if (is_array($week) && count($week) > 0) {
				$week = $week[0];
                // Get last modification time of the current PHP file
                $content_last_mod_time = filemtime(__FILE__);

				// Get last modification time of the main content (that user sees)
				$cond = array("idweek" => $week->id);
				$getUpdated = $this->factory->find("B7KP\Entity\\" . ucfirst($type) . "_charts", $cond, "updated DESC, rank ASC", "0, 1");
				if(count($getUpdated) > 0) {
					$content_last_mod_time = $getUpdated[0]->updated;
				}

                // Combine both to generate a unique ETag for a unique content
                // Specification says ETag should be specified within double quotes
                $etag = '"' . $content_last_mod_time . '.' . sha1(serialize($settings)) . '"';

                // Set Cache-Control header
                header('Cache-Control: max-age=31536000');

                // Set ETag header
				header('ETag: ' . $etag);
				header_remove('Pragma');

                // Check whether browser had sent a HTTP_IF_NONE_MATCH request header
                if (isset($_SERVER['HTTP_IF_NONE_MATCH'])) {
                    // If HTTP_IF_NONE_MATCH is same as the generated ETag => content is the same as browser cache
                    // So send a 304 Not Modified response header and exit
                    if ($_SERVER['HTTP_IF_NONE_MATCH'] == $etag) {
                        header('HTTP/1.1 304 Not Modified', true, 304);
                        exit();
                    }
                }

                $bgimage = $this->getUserBg($user);

                $limit = 10;
                if ($settings instanceof Settings) {
                    $prop = substr($type, 0, 3) . "_limit";
                    $limit = $settings->$prop;
                }
                $chart = new Charts($this->factory, $user);
                $list = $chart->getWeeklyCharts($week, $type, $limit, true, $settings);
                $vars = array
                    (
                    'user' => $user,
                    'list' => $list,
                    'type' => $type,
                    'week' => $week,
                    "lfm_bg" => $bgimage,
                    "lfm_image" => $this->getUserBg($user, true),
                );
                $this->render("chart.php", $vars);
            } else {
                $this->redirectToRoute("registernotfound", array("entity" => "Week"));
            }
        } else {
            $this->redirectToRoute("chart_list", array("login" => $user->login));
        }
    }

    /**
     * @Route(name=bwp|route=/user/{login}/charts/{type}/overall/bwp)
     */
    public function biggestWeeklyPlaycounts($login, $type, $year = null)
    {
        $user = $this->isValidUser($login);
        $this->isValidType($type, $user);
        $bgimage = $this->getUserBg($user);
        $entity = "B7KP\Entity\\" . ucfirst($type) . "_charts";
        $table = $type . "_charts";
        $settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
        $filter = intval($year) > 0 ? " AND YEAR(w.to_day) = " . intval($year) : "";
        $limit = substr($type, 0, 3) . "_limit";
        $biggest = $this->factory->findSql($entity, "SELECT t.* FROM " . $table . " t, week w, user u WHERE t.idweek = w.id AND w.iduser = u.id AND u.id = " . $user->id . $filter . " ORDER BY t.playcount DESC, w.week ASC LIMIT 0, 100");
        $vars = array
            (
            "user" => $user,
            "list" => $biggest,
            "type" => $type,
            "year" => $year,
            "limit" => $settings->$limit,
            "lfm_bg" => $bgimage,
            "lfm_image" => $this->getUserBg($user, true),
        );
        $this->render("bwp.php", $vars);
    }

    /**
     * @Route(name=bwp_year|route=/user/{login}/charts/{type}/overall/bwp/{year})
     */
    public function biggestWeeklyPlaycountsByYear($login, $type, $year)
    {
        return $this->biggestWeeklyPlaycounts($login, $type, $year);
    }

    /**
     * @Route(name=bwp_at|route=/user/{login}/charts/{type}/overall/bwp/{signal}/{top})
     */
    public function biggestWeeklyPlaycountsAt($login, $type, $signal, $top, $year = null)
    {
        $user = $this->isValidUser($login);
        $this->isValidType($type, $user);
        $signal = $this->isValidSignal($signal);
        $bgimage = $this->getUserBg($user);
        $entity = "B7KP\Entity\\" . ucfirst($type) . "_charts";
        $table = $type . "_charts";
        $top = intval($top) > 1 ? intval($top) : 1;
        $settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
        $filter = intval($year) > 0 ? " AND YEAR(w.to_day) = " . intval($year) : "";
        $limit = substr($type, 0, 3) . "_limit";
        $biggest = $this->factory->findSql($entity, "SELECT t.* FROM " . $table . " t, week w, user u WHERE t.idweek = w.id AND w.iduser = u.id AND u.id = " . $user->id . $filter . " AND t.rank " . $signal . " " . $top . " ORDER BY t.playcount DESC, w.week ASC");
        $vars = array
            (
            "user" => $user,
            "list" => $biggest,
            "type" => $type,
            "year" => $year,
            "top" => $top,
            "signal" => $signal,
            "limit" => $settings->$limit,
            "lfm_bg" => $bgimage,
            "lfm_image" => $this->getUserBg($user, true),
        );
        $this->render("bwp.php", $vars);
    }

    /**
     * @Route(name=bwp_at_year|route=/user/{login}/charts/{type}/overall/bwp/{signal}/{top}/{year})
     */
    public function biggestWeeklyPlaycountsAtByYear($login, $type, $signal, $top, $year)
    {
        return $this->biggestWeeklyPlaycountsAt($login, $type, $signal, $top, $year);
    }

    /**
     * @Route(name=mwa|route=/user/{login}/charts/{type}/overall/mwa/top/{rank})
     */
    public function moreWeeksAt($login, $type, $rank, $year = null)
    {
        $user = $this->isValidUser($login);
        $this->isValidType($type, $user);
        $bgimage = $this->getUserBg($user);
        $settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
        if (!is_object($settings)) {
            $settings = new Settings();
        }
        $rank = intval($rank) > 1 ? intval($rank) : 1;
        $limit = substr($type, 0, 3) . "_limit";
        if ($rank > $settings->$limit) {
            $rank = $settings->$limit;
        }
        $table = $type . "_charts";
        $dao = Dao::getConn();
        $group = "";
        if ($type != "artist"): $group .= ", t." . $type;endif;
        $filter = intval($year) > 0 ? " AND YEAR(w.to_day) = " . intval($year) : "";
        $dao->run("SET sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''));");
        $biggest = $dao->run("SELECT t.*, count(w.week) as total FROM " . $table . " t, week w, user u WHERE t.idweek = w.id AND w.iduser = u.id AND u.id = " . $user->id . $filter . " AND t.rank <= " . $rank . " GROUP BY t.artist" . $group . " ORDER BY total DESC, w.week ASC");
        $vars = array
            (
            "user" => $user,
            "list" => $biggest,
            "type" => $type,
            "rank" => $rank,
            "year" => $year,
            "settings" => $settings,
            "lfm_bg" => $bgimage,
            "lfm_image" => $this->getUserBg($user, true),
        );
        $this->render("mwa.php", $vars);
    }

    /**
     * @Route(name=mwa_year|route=/user/{login}/charts/{type}/overall/mwa/top/{rank}/{year})
     */
    public function moreWeeksAtYear($login, $type, $rank, $year)
    {
        return $this->moreWeeksAt($login, $type, $rank, $year);
    }

    /**
     * @Route(name=mia|route=/user/{login}/charts/artist/overall/more/{type}/at/{rank})
     */
    public function moreItemsAt($login, $type, $rank, $year = null)
    {
        $user = $this->isValidUser($login);
        $this->isValidType($type, $user);
        $bgimage = $this->getUserBg($user);
        $settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
        if ($type == "artist") {
            $this->redirectToRoute("chart_list", array("login" => $user->login));
        }
        if (!is_object($settings)) {
            $settings = new Settings();
        }
        $rank = intval($rank) > 1 ? intval($rank) : 1;
        $limit = substr($type, 0, 3) . "_limit";
        if ($rank > $settings->$limit) {
            $rank = $settings->$limit;
        }
        $table = $type . "_charts";
        $filter = intval($year) > 0 ? " AND YEAR(w.to_day) = " . intval($year) : "";
        $dao = Dao::getConn();

        $col = "t." . $type;
        $dao->run("SET sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''));");
        $biggest = $dao->run("SELECT t.*, count(" . $col . ") as total, COUNT(DISTINCT " . $col . ") AS uniques FROM " . $table . " t, week w, user u WHERE t.idweek = w.id AND w.iduser = u.id AND u.id = " . $user->id . $filter . " AND t.rank <= " . $rank . " GROUP BY t.artist ORDER BY uniques DESC, total DESC");
        $vars = array
            (
            "user" => $user,
            "list" => $biggest,
            "type" => $type,
            "rank" => $rank,
            "year" => $year,
            "settings" => $settings,
            "lfm_bg" => $bgimage,
            "lfm_image" => $this->getUserBg($user, true),
        );
        $this->render("mia.php", $vars);
    }

    /**
     * @Route(name=mia_year|route=/user/{login}/charts/artist/overall/more/{type}/at/{rank}/{year})
     */
    public function moreItemsAtYear($login, $type, $rank, $year)
    {
        return $this->moreItemsAt($login, $type, $rank, $year);
    }


    /**
     * @Route(name=editwkchart|route=/editweek/{id}/{type})
     */
    public function editChart($id, $type)
    {
        if ($this->isAjaxRequest()) {
            $user = UserSession::getUser($this->factory);
            $week = $this->factory->findOneBy("B7KP\Entity\Week", $id);
            $types = array("artist", "music", "album");
            if (is_object($week) && is_object($user) && $week->iduser == $user->id && in_array($type, $types)) {
                $meth = "getWeekly" . ucfirst($type) . "List";
                $settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
                $gmt = new \DateTimeZone("GMT");
                $from_day = new \DateTime($week->from_day, $gmt);
                $to_day = new \DateTime($week->to_day, $gmt);
                $from_day = $from_day->format("U");
                $to_day = $to_day->format("U");
                $vars = array("from" => $from_day, "to" => $to_day);
                $lfm = new LastFm();
                $lfm->setUser($user->login);
                $list = $lfm->$meth($vars);
                $this->render("editweek.php", array("week" => $week, "user" => $user, "settings" => $settings, "list" => $list, "type" => $type));
            } else {
                echo false;
            }
        } else {
            $this->redirectToRoute("home");
        }
    }

    /**
     * @Route(name=cert_ajax|route=/ajax/cert/{login}/{type}/{plays})
     */
    public function certAjax($login, $type, $plays)
    {
        if ($this->isAjaxRequest()) {
            $user = $this->isValidUser($login);
            $c = new Certified($user, $this->factory);
            echo $c->getCertification($type, $plays, "json");
        } else {
            $this->redirectToRoute("home");
        }
    }

    /**
     * @Route(name=allkill|route=/user/{login}/charts/allkill)
     */
    public function allKill($login, $year = null)
    {
        $user = $this->isValidUser($login);
        $chart = new Charts($this->factory, $user);
        $allkill = $chart->getAllKill($year);
        $vars = array
            (
            "user" => $user,
            "allkill" => $allkill,
            "year" => $year,
            "lfm_bg" => $this->getUserBg($user),
            "lfm_image" => $this->getUserBg($user, true),
        );

        $this->render("allkill.php", $vars);
    }

    /**
     * @Route(name=allkill_year|route=/user/{login}/charts/allkill/{year})
     */
    public function allKillYear($login, $year)
    {
        return $this->allKill($login, $year);
    }

    /**
     * @Route(name=b_debuts|route=/user/{login}/charts/{type}/overall/debuts)
     */
    public function biggestDebuts($login, $type, $year = null)
    {
        $user = $this->isValidUser($login);
        $this->isValidType($type, $user);
        $chart = new Charts($this->factory, $user);
        $debuts = $chart->getBiggestDebuts($type, "", "playcount DESC", "", $year);
        $settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
        $limit = substr($type, 0, 3) . "_limit";
        $vars = array
            (
            "user" => $user,
            "list" => $debuts,
            "type" => $type,
            "year" => $year,
            "limit" => $settings->$limit,
            "lfm_bg" => $this->getUserBg($user),
            "lfm_image" => $this->getUserBg($user, true),
        );

        $this->render("debuts.php", $vars);
    }

    /**
     * @Route(name=b_debuts_year|route=/user/{login}/charts/{type}/overall/debuts-year/{year})
     */
    public function biggestDebutsYear($login, $type, $year)
    {
        return $this->biggestDebuts($login, $type, $year);
    }

    /**
     * @Route(name=debuts_at|route=/user/{login}/charts/{type}/overall/debuts/{signal}/{top})
     */
    public function biggestDebutsAt($login, $type, $signal, $top, $year = null)
    {
        $user = $this->isValidUser($login);
        $signal = $this->isValidSignal($signal);
        $this->isValidType($type, $user);
        $top = intval($top) > 0 ? intval($top) : 1;
        $chart = new Charts($this->factory, $user);
        $settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
        $debuts = $chart->getBiggestDebuts($type, "rank " . $signal . " " . $top, "playcount DESC", "", $year);
        $limit = substr($type, 0, 3) . "_limit";
        $vars = array
            (
            "user" => $user,
            "list" => $debuts,
            "type" => $type,
            "top" => $top,
            "signal" => $signal,
            "year" => $year,
            "limit" => $settings->$limit,
            "lfm_bg" => $this->getUserBg($user),
            "lfm_image" => $this->getUserBg($user, true),
        );

        $this->render("debuts.php", $vars);
    }

    /**
     * @Route(name=debuts_at_year|route=/user/{login}/charts/{type}/overall/debuts-year/{signal}/{top}/{year})
     */
    public function biggestDebutsAtYear($login, $type, $signal, $top, $year)
    {
        return $this->biggestDebutsAt($login, $type, $signal, $top, $year);
    }

    /**
     * @Route(name=debuts_by_main|route=/user/{login}/charts/{type}/overall/awm/debuts)
     */
    public function biggestDebutsAtByArtist($login, $type, $year = null)
    {
        $user = $this->isValidUser($login);
        $signal = "=";
        $type = $type == "artist" ? null : $type;
        $this->isValidType($type, $user);
        $top = 1;
        $this->isValidType($type, $user);
        $chart = new Charts($this->factory, $user);
        $settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
        $debuts = $chart->getBiggestDebuts($type, "rank " . $signal . " " . $top . " GROUP BY " . $type . "_charts.artist ORDER BY total DESC", "", "COUNT(" . $type . "_charts." . $type . ") as total,", $year);
        $limit = substr($type, 0, 3) . "_limit";
        $vars = array
            (
            "user" => $user,
            "list" => $debuts,
            "type" => $type,
            "top" => $top,
            "signal" => $signal,
            "year" => $year,
            "limit" => $settings->$limit,
            "lfm_bg" => $this->getUserBg($user),
            "lfm_image" => $this->getUserBg($user, true),
        );

        $this->render("debutsbyartist.php", $vars);
    }

    /**
     * @Route(name=debuts_by_main_year|route=/user/{login}/charts/{type}/overall/awm/debuts-year/{year})
     */
    public function biggestDebutsAtByArtistYear($login, $type, $year)
    {
        return $this->biggestDebutsAtByArtist($login, $type, $year);
    }

    /**
     * @Route(name=debuts_by|route=/user/{login}/charts/{type}/overall/awm/debuts/{signal}/{top})
     */
    public function biggestDebutsAtByArtistAtTop($login, $type, $signal, $top, $year = null)
    {
        $user = $this->isValidUser($login);
        $signal = $this->isValidSignal($signal);
        $type = $type == "artist" ? null : $type;
        $this->isValidType($type, $user);
        $top = intval($top) > 0 ? intval($top) : 1;
        $chart = new Charts($this->factory, $user);
        $settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
        $debuts = $chart->getBiggestDebuts($type, "rank " . $signal . " " . $top . " GROUP BY " . $type . "_charts.artist ORDER BY total DESC", "", "COUNT(" . $type . "_charts." . $type . ") as total,", $year);
        $limit = substr($type, 0, 3) . "_limit";
        $vars = array
            (
            "user" => $user,
            "list" => $debuts,
            "type" => $type,
            "top" => $top,
            "signal" => $signal,
            "year" => $year,
            "limit" => $settings->$limit,
            "lfm_bg" => $this->getUserBg($user),
            "lfm_image" => $this->getUserBg($user, true),
        );

        $this->render("debutsbyartist.php", $vars);
    }

    /**
     * @Route(name=debuts_by_year|route=/user/{login}/charts/{type}/overall/awm/debuts-year/{signal}/{top}/{year})
     */
    public function biggestDebutsAtByArtistAtTopYear($login, $type, $signal, $top, $year)
    {
        return $this->biggestDebutsAtByArtistAtTop($login, $type, $signal, $top, $year);
    }

    /**
     * @Route(name=user_cert_art|route=/user/{login}/charts/certified/{type})
     */
    public function certifiedByArtist($login, $type)
    {
        $user = $this->isValidUser($login);
        $type = $type == "artist" ? null : $type;
        $this->isValidType($type, $user);
        $artist = array();
        $chart = new Charts($this->factory, $user);
        $c = new Certified($user, $this->factory);
        $list = $c->getCertifiedByArtist($type);
        $vars = array
            (
            "user" => $user,
            "list" => $list,
            "type" => $type,
            "weight" => $c->getWeights($type),
            "lfm_bg" => $this->getUserBg($user),
            "lfm_image" => $this->getUserBg($user, true),
        );

        $this->render("cert.php", $vars);
    }

    /**
     * @Route(name=pts_list|route=/user/{login}/charts/points/{type}/)
     */
    public function pointsList($login, $type, $year = null)
    {
        $user = $this->isValidUser($login);
        $this->isValidType($type, $user);
        $chart = new Certified($user, $this->factory);
        $settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
        $list = $chart->getChartPointsList($type, $year);
        $vars = array
            (
            "user" => $user,
            "list" => $list,
            "type" => $type,
            "year" => $year,
            "lfm_bg" => $this->getUserBg($user),
            "lfm_image" => $this->getUserBg($user, true),
        );
        $this->render("points.php", $vars);
    }

    /**
     * @Route(name=pts_list_year|route=/user/{login}/charts/points/{type}/{year})
     */
    public function pointsListYear($login, $type, $year)
    {
        return $this->pointsList($login, $type, $year);
    }

    protected function checkAccess()
    {
        if (UserSession::getUser($this->factory) == false) {
            $this->redirectToRoute("login");
        }
    }

    protected function isValidType($type, $user)
    {
        if ($type != "artist" && $type != "music" && $type != "album") {
            $this->redirectToRoute("chart_list", array("login" => $user->login));
        }
    }

    protected function isValidSignal($signal)
    {
        $return = "=";
        $valid = array("=", ">", "<", ">=", "<=");
        if (in_array(urldecode($signal), $valid)) {
            $return = urldecode($signal);
        }
        return $return;
    }

    protected function getUserBg($user, $avatar = false, $force = false)
    {
        return false;
        /***
        $lfm = new LastFm();
        $last = $lfm->setUser($user->login)->getUserInfo();
        if ($avatar) {
            $bgimage = str_replace("34s", "avatar170s", $last["image"]);
        } else {
	        return false; // last.fm não envia mais imagens do artista
            $bgimage = false;
            if ($force) {
                $acts = $lfm->getUserTopArtist(array("limit" => 1, "period" => "overall"));

                if (isset($acts[0])):
                    $bgimage = $acts[0]["images"]["mega"];
                endif;
            }
        }

        return $bgimage;
        **/
    }

    protected function isValidUser($login)
    {
        $user = $this->factory->findOneBy("B7KP\Entity\User", $login, "login");
        if ($user instanceof User) {
            $perm = new \B7KP\Utils\PermissionCheck("User");
            $settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
            $visibility = $perm->viewPermission($user, $this->factory, $settings->visibility);
            if ($visibility) {
                return $user;
            } else {
                $this->redirectToRoute("profile", array("login" => $user->login));
            }
        } else {
            $this->redirectToRoute("404");
        }
    }
}
