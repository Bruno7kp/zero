<?php 
namespace B7KP\Utils;

use B7KP\Model\Model;
use B7KP\Core\Dao;
use B7KP\Entity\User;
use B7KP\Entity\Settings;
use B7KP\Library\Lang;
use B7KP\Library\Url;
use Imagine\Gd\Font;
use Imagine\Gd\Imagine;
use Imagine\Image\Box;
use Imagine\Image\Palette\InvalidArgumentException;
use Imagine\Image\Point;
use LastFmApi\Main\LastFm;

class Certified
{
	private $lastfm;
	private $user;
	private $settings;
	private $album;
	private $music;
	private $type;
	
	function __construct(User $user, Model $factory)
	{
		$this->user = $user;
		$this->lastfm = new LastFm();
		$this->lastfm->setUser($this->user->login);
		$this->factory = $factory;
		$this->dao = Dao::getConn();
		$this->settings = $this->factory->findOneBy("B7KP\Entity\Settings", $this->user->id, "iduser");
		$this->setValues();
	}

	private function setValues()
	{
		$this->album = new \stdClass();
		$this->album->gold 		= $this->settings->alb_cert_gold;
		$this->album->platinum 	= $this->settings->alb_cert_platinum;
		$this->album->diamond 	= $this->settings->alb_cert_diamond;
		$this->music = new \stdClass();
		$this->music->gold 		= $this->settings->mus_cert_gold;
		$this->music->platinum 	= $this->settings->mus_cert_platinum;
		$this->music->diamond 	= $this->settings->mus_cert_diamond;
		$this->type = $this->settings->cert_type;
	}

	public function getPoints($type, $name, $artist)
	{
		if($this->type == 1)
		{
            return $this->getChartPoints($type, $name, $artist);
		}
		else if($this->type == 2)
		{
			return $this->getPlaycountPlusPoints($type, $name, $artist);
		}
		else
        {
            return $this->getPlaycount($type, $name, $artist);
        }
	}

	public function getPlaycountPlusPoints($type, $name, $artist)
    {
        return $this->getPlaycount($type, $name, $artist) + $this->getChartPoints($type, $name, $artist);
    }

	public function getPlaycount($type, $name, $artist)
	{
		$valid = array("album", "music");
		if(!in_array($type, $valid)): return null; endif;
		$fn 	= "get".strtoupper($type)."Info";
		$info 	= $this->lastfm->$fn($name, $artist);
		$plays 	= $info["userplaycount"];
		return $plays;
	}

	public function getChartPoints($type, $name, $artist)
	{
		$valid = array("album", "music");
		if(!in_array($type, $valid)): return null; endif;
		$limit = substr($type, 0, 3)."_limit";
		$table = $type."_charts";
		$pts = $this->dao->run("SELECT count(t.idweek) * 100 - (sum(t.rank) - count(t.idweek))*2 as pts FROM ".$table." t, week w, user u WHERE t.".$type." = '".addslashes($name)."' and t.artist = '".addslashes($artist)."' AND w.id = t.idweek AND w.iduser = u.id AND u.id = ".$this->user->id." AND t.rank <= ".$this->settings->$limit);

		return $pts[0]->pts;
	}

	public function getArtistChartPoints($name)
	{
		$limit = "art_limit";
		$pts = $this->dao->run("SELECT count(idweek) * 100 - (sum(t.rank) - count(t.idweek))*2 as pts FROM artist_charts t, week w, user u WHERE t.artist = '".addslashes($name)."' AND w.id = t.idweek AND w.iduser = u.id AND u.id = ".$this->user->id." AND t.rank <= ".$this->settings->$limit);

		return $pts[0]->pts;
	}

	public function getChartPointsList($type)
	{
		$valid = array("album", "music", "artist");
		if(!in_array($type, $valid)): return null; endif;
		$limit = substr($type, 0, 3)."_limit";
		$table = $type."_charts";
		if($type != "artist")
		{
			$pts = $this->dao->run("SELECT count(t.idweek) * 100 - (sum(t.rank) - count(t.idweek))*2 as pts, t.".$type.", t.artist, min(t.rank) as peak, count(t.idweek) as weeks FROM ".$table." t, week w, user u WHERE w.id = t.idweek AND w.iduser = u.id AND u.id = ".$this->user->id." AND t.rank <= ".$this->settings->$limit." GROUP BY t.artist, t.".$type." ORDER BY pts DESC");
		}
		else
		{
			$pts = $this->dao->run("SELECT count(t.idweek) * 100 - (sum(t.rank) - count(t.idweek))*2 as pts, t.artist, min(t.rank) as peak, count(t.idweek) as weeks FROM artist_charts t, week w, user u WHERE w.id = t.idweek AND w.iduser = u.id AND u.id = ".$this->user->id." AND t.rank <= ".$this->settings->$limit." GROUP BY t.artist ORDER BY pts DESC");
		}

		return $pts;
	}

	public function getCertifiedByArtist($type, $artist = false)
	{
		$valid = array("album", "music");
		if(!in_array($type, $valid)): return null; endif;
		$list = array();
		if($this->type)
		{
			// Pts
			$certs = $this->getChartPointsList($type);
			$w = $this->getWeights($type);
			foreach ($certs as $key => $value) 
			{
				$vcert = $this->getDefaultCert($type, $value->pts);
				if($vcert["p"] + $vcert["g"] + $vcert["d"] == 0)
				{
					continue;
				}
				if(isset($list[$value->artist]))
				{
					$list[$value->artist]["total"] += $vcert["g"] + $vcert["p"] + $vcert["d"];
					$list[$value->artist]["utotal"]++;
					$list[$value->artist]["wtotal"] += ($vcert["g"] * $w["g"]) + ($vcert["p"] * $w["p"]) + ($vcert["d"] * $w["d"]);
					$list[$value->artist]["g"] += $vcert["g"];
					$list[$value->artist]["p"] += $vcert["p"];
					$list[$value->artist]["d"] += $vcert["d"];
					$list[$value->artist]["ug"] += $vcert["g"];
					$list[$value->artist]["up"] += ($vcert["p"] > 0 && $vcert["d"] == 0 ? 1 : 0);
					$list[$value->artist]["ud"] += $vcert["d"] > 0 ? 1 : 0;
					$list[$value->artist]["wg"] += $vcert["g"] * $w["g"];
					$list[$value->artist]["wp"] += $vcert["p"] * $w["p"];
					$list[$value->artist]["wd"] += $vcert["d"] * $w["d"];
					$list[$value->artist]["list"][] = array("name" => $value->$type, "c" => $vcert);
				}
				else
				{
					$list[$value->artist] = array
											(
												"total" => $vcert["g"] + $vcert["p"] + $vcert["d"], 
												"utotal" => 1,
												"wtotal" => ($vcert["g"] * $w["g"]) + ($vcert["p"] * $w["p"]) + ($vcert["d"] * $w["d"]),
												"g" => $vcert["g"], 
												"p" => $vcert["p"], 
												"d" => $vcert["d"],
												"ug" => $vcert["g"],
												"up" => ($vcert["p"] > 0 && $vcert["d"] == 0 ? 1 : 0),
												"ud" => $vcert["d"] > 0 ? 1 : 0,
												"wg" => $vcert["g"] * $w["g"],
												"wp" => $vcert["p"] * $w["p"],
												"wd" => $vcert["d"] * $w["d"],
												"list" => array(array("name" => $value->$type, "c" => $vcert))
											);
				}
			}

			if($artist)
			{
				return isset($list[$artist]) ? $list[$artist] : null;
			}
			else
			{
				uasort($list, function($a, $b) {
				    return $b['total'] > $a['total'];
				});
				return $list;
			}
		}
		else
		{
			// Rep
			return false;
		}
	}

	public function getWeights($type)
	{
		$valid = array("album", "music");
		if(!in_array($type, $valid)): return null; endif;

		$w = array("g" => 0, "p" => 0, "d" => 0);
		$g = $this->$type->gold;
		$p = $this->$type->platinum;
		$d = $this->$type->diamond;

		if($p > 0)
		{
			$w["p"] = 1;
			if($g > 0)
			{
				$w["g"] = round($g / $p, 2);
			}
			if($d > 0)
			{
				$w["d"] = round($d / $p ,2);
			}
		}
		return $w;
	}

	public function getCertification($type, $plays, $return = "default")
	{
		$valid = array("album", "music");
		if(!in_array($type, $valid)): return null; endif;

		$certification = $this->getDefaultCert($type, $plays);

		switch ($return) {
			case 'text':
				$text = "";
				if($certification['g'] > 0)
				{
					$text = Lang::get('gold');
				}
				else
				{
					if($certification['d'] > 0)
					{
						$text = $certification['d']."x ".Lang::get('diam');
					}
					if($certification['p'] > 0)
					{
						if($certification['d'] > 0)
						{
							$text .= " + ";
						}
						$text .= $certification['p']."x ".Lang::get('plat');
					}
				}
				$certification = empty($text) ? Lang::get('none') : $text;
				break;

			case 'text+icon':
				$text = "";
				if($certification['g'] > 0)
				{
					$file = "/web/img/gold-icon.png";
					$text = "<img class='img-disc' src='".Url::getBaseUrl().$file."' alt='".Lang::get("gold")."' title='".Lang::get("gold")."'/>";
				}
				else
				{
					if($certification['d'] > 0)
					{
						$file = "/web/img/diamond-icon.png";
						$text = $certification['d']."x "."<img class='img-disc' src='".Url::getBaseUrl().$file."' alt='".Lang::get("diam")."' title='".Lang::get("diam")."'/>";
					}
					if($certification['p'] > 0)
					{
						$file = "/web/img/platinum-icon.png";
						if($certification['d'] > 0)
						{
							$text .= " + ";
						}
						$text .= $certification['p']."x "."<img class='img-disc' src='".Url::getBaseUrl().$file."' alt='".Lang::get("plat")."' title='".Lang::get("plat")."'/>";
					}
				}
				$certification = empty($text) ? "-" : $text;
				break;

			case 'icon':
				$file = "";
				if($certification['g'] > 0)
				{
					$file = "/web/img/gold-icon.png";
				}
				else
				{
					if($certification['d'] > 0)
					{
						$num = $certification['d'];
						if($certification['d'] > 5): $num = 5; endif;
						if($certification['d'] == 1): $num = ""; endif;
						$file = "/web/img/diamond-icon".$num.".png";
						if($certification['d'] == 1 && $certification['p'] == 1)
						{
							$file = "/web/img/diamond-platinum.png";
						}
						if($certification['d'] == 1 && $certification['p'] > 1)
						{
							$file = "/web/img/diamond-platinum2.png";
						}
					}
					else if($certification['p'] > 0)
					{
						$num = $certification['p'];
						if($certification['p'] > 5): $num = 5; endif;
						if($certification['p'] == 1): $num = ""; endif;
						$file .= "/web/img/platinum-icon".$num.".png";
					}
				}
				$certification = empty($file) ? "<i class='icon-vynil ico-color'></i>" : "<img class='img-disc' src='".Url::getBaseUrl().$file."' alt='Certification'/>";
				break;

			case 'image':
				$file = "";
				if($certification['g'] > 0)
				{
					$file = "web/img/gold.png";
				}
				else
				{
					if($certification['d'] > 0)
					{
						$file = "web/img/diamond.png";
					}
					if($certification['p'] > 0)
					{
						if($certification['d'] > 0)
						{
							$file .= "";
						}
						else
						{
							$file .= "web/img/platinum.png";
						}
					}
				}
				$certification = empty($file) ? "web/img/default-alb.png" : $file;
				break;

			case 'class':
				if($certification['d'] > 0)
				{
					$certification = "d-row";
				}
				elseif($certification['p'] > 0)
				{
					$certification = "p-row";
				}
				elseif($certification['g'] > 0)
				{
					$certification = "g-row";
				}
				else
				{
					$certification = "";
				}
				break;
		}

		return $certification;
	}

	private function getDefaultCert($type, $plays)
	{
		$g = $this->$type->gold;
		$p = $this->$type->platinum;
		$d = $this->$type->diamond;
		$cert = array('g' => 0, 'p' => 0, 'd' => 0);
		if($g > 0)
		{
			if($plays >= $g && $plays < $p)
			{
				$cert['g'] = 1;
				return $cert;
			}
		}
		if($p > 0 && $plays >= $p)
		{
			if($d > 0 && $plays >= $d)
			{
				while ($plays >= $d) {
					$cert['d']++;
					$plays -= $d;
				}
			}
			$cert['p'] = floor($plays/$p);
		}

		return $cert;
	}

	private function getValueByCert($type, $points)
	{
		$array = $this->getDefaultCert($type, $points);
		$g = $this->$type->gold;
		$p = $this->$type->platinum;
		$d = $this->$type->diamond;

		return ($array["g"] * $g) + ($array["p"] * $p) + ($array["d"] * $d);
	}

	public function getValueByArray($type, $array)
	{
		$array = (array) $array;
		$g = $this->$type->gold;
		$p = $this->$type->platinum;
		$d = $this->$type->diamond;

		return ($array["g"] * $g) + ($array["p"] * $p) + ($array["d"] * $d);
	}

	public function getPlaque($type, $name, $artist)
	{
		$plaques = $this->factory->findSql("\B7KP\Entity\Plaque", "SELECT * from plaque WHERE type = '".$type."' AND iduser = '".$this->user->id."' AND name = '".addslashes($name)."' AND artist = '".addslashes($artist)."' ORDER BY id DESC");
		return $plaques;
	}

    /**
     * @param $type
     * @param $points
     * @param $image
     * @param $name
     * @param $artist
     * @return bool
     * @throws \Exception
     * @throws InvalidArgumentException
     */
    public function createPlaque($type, $points, $image, $name, $artist)
	{
		$valid = array("album", "music");
		if(!in_array($type, $valid)): return null; endif;
		$date = new \DateTime();
		$dots = mb_strlen($name) > 20 ? "..." : "";
		$textname = mb_substr($name, 0, 20).$dots;
		$filename = "web/img/temp/".md5($textname).md5($this->user->login);
		// Imagine
		$imagine = new Imagine();
		// Capa do álbum/foto do artista
		$image = empty($image) ? "web/img/default-alb.png" : str_replace("https", "http", $image);
		$photo = $imagine->open($image);
		$bg = $imagine->open($image);
		$minphoto  = new Box(100, 100);
		$maxphoto  = new Box(500, 500);
		$discphoto  = new Box(250, 250);
		$size  = new Box(400, 500);
		$photo->resize($minphoto); // Foto
		$bg->resize($maxphoto)->crop(new Point(50, 0), new Box(400, 500)); // Fundo
		$bg->effects()
		    ->blur(25);
		// Base
		$base = $imagine->open('web/img/base2.png');
		// Imagem certificado
		$disc = $this->getCertification($type, $points, "image");
		$disc = $imagine->open($disc);
		$disc->resize($discphoto);
		// texto do certificado
		$text = $this->getCertification($type, $points, "text");
		$value = $this->getValueByCert($type, $points);
		$typecert = $this->type == 0 ? Lang::get("play_x") : $this->type == 1 ? Lang::get("pt_x") : Lang::get("both_x");
		$value .= "+ ".mb_strtolower($typecert);
		// Cria imagem
		$image = $imagine->create($size);
		$image->paste($bg, new Point(0, 0));
		$image->paste($base, new Point(0, 0));
		$image->paste($disc, new Point(75, 100));
		$image->draw()
          	->text($this->user->login, new Font('web/fonts/Roboto-Regular.ttf', 25, $image->palette()->color('#fff')), new Point(100, 40))
          	->text($textname, new Font('web/fonts/ARIALUNI.TTF', 14, $image->palette()->color('#fff')), new Point(150, 370))
          	->text($artist, new Font('web/fonts/ARIALUNI.TTF', 12, $image->palette()->color('#fff')), new Point(150, 390))
          	->text($text, new Font('web/fonts/Roboto-Regular.ttf', 12, $image->palette()->color('#fff')), new Point(150, 415))
          	->text($value, new Font('web/fonts/Roboto-Regular.ttf', 11, $image->palette()->color('#fff')), new Point(150, 435))
          	->text($date->format("Y.m.d"), new Font('web/fonts/Roboto-Regular.ttf', 9, $image->palette()->color('#fff')), new Point(150, 460));
        $image->paste($photo, new Point(37, 370));
		$image->save($filename.'.png', array('png_compression_level' => 9));
		return $filename.".png";
	}

    /**
     * @param $url
     * @param $type
     * @param $points
     * @param $image
     * @param $name
     * @param $artist
     * @return mixed
     * @throws \Exception
     */
    public function savePlaque($url, $type, $points, $image, $name, $artist)
    {
        $date = new \DateTime();

        $data = new \stdClass();
        $data->iduser = $this->user->id;
        $data->url = $url;
        $data->type = $type;
        $data->name = $name;
        $data->artist = $artist;
        $data->date = $date->format("Y-m-d");
        $data->certified = json_encode($this->getCertification($type, $points));
        $id = $this->factory->add("\B7KP\Entity\Plaque", $data);

        if(file_exists($image))
            unlink($image);
        return $id;
    }
}
