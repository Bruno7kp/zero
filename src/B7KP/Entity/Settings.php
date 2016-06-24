<?php
namespace B7KP\Entity;

use B7KP\Utils\Constants as C;
use B7KP\Library\Lang;

class Settings extends Entity
{
	/**
	* @Assert(null=false|int)
	*/
	protected $iduser;

	/**
	* @Assert(null=false|int|option)
	* @Options(values={"10": "Top 10","5": "Top 5", "15": "Top 15", "20": "Top 20", "25": "Top 25", "30": "Top 30", "40": "Top 40", "50": "Top 50"})
	*/
	protected $art_limit;

	/**
	* @Assert(null=false|int|option)
	* @Options(values={"10": "Top 10","5": "Top 5", "15": "Top 15", "20": "Top 20", "25": "Top 25", "30": "Top 30", "40": "Top 40", "50": "Top 50"})
	*/
	protected $alb_limit;

	/**
	* @Assert(null=false|int|option)
	* @Options(values={"10": "Top 10","5": "Top 5", "15": "Top 15", "20": "Top 20", "25": "Top 25", "30": "Top 30", "40": "Top 40", "50": "Top 50"})
	*/
	protected $mus_limit;

	/**
	* @Assert(null=false|int|option)
	* @Options(values={"0": "No","1": "Yes"}|settings={"translate": "1"})
	*/
	protected $show_images;

	/**
	* @Assert(null=false|int|option)
	* @Options(values={"0": "No","1": "Yes"}|settings={"translate": "1"})
	*/
	protected $show_dropouts;

	/**
	* @Assert(null=false|int|option)
	* @Options(values={"1": "Yes","0": "No"}|settings={"translate": "1"})
	*/
	protected $show_first_image;

	/**
	* @Assert(null=false|int|option)
	* @Options(values={"1": "sett_diff_lw","0": "sett_none","2": "sett_lw", "3": "sett_pp"}|settings={"translate": "1"})
	*/
	protected $show_move;

	/**
	* @Assert(null=false|int|option)
	* @Options(values={"1": "Yes","0": "No"}|settings={"translate": "1"})
	*/
	protected $show_playcounts;

	/**
	* @Assert(null=false|int|option)
	* @Options(values={"0": "Português","1": "English"})
	*/
	protected $lang;

	/**
	* @Assert(null=false|minNum=0|int)
	*/
	protected $alb_cert_gold;

	/**
	* @Assert(null=false|int|biggerThan=alb_cert_gold)
	*/
	protected $alb_cert_platinum;

	/**
	* @Assert(null=false|int|biggerThan=alb_cert_platinum)
	*/
	protected $alb_cert_diamond;

	/**
	* @Assert(null=false|minNum=0|int)
	*/
	protected $mus_cert_gold;

	/**
	* @Assert(null=false|int|biggerThan=mus_cert_gold)
	*/
	protected $mus_cert_platinum;

	/**
	* @Assert(null=false|int|biggerThan=mus_cert_platinum)
	*/
	protected $mus_cert_diamond;

	/**
	* @Assert(null=false|int|option)
	* @Options(values={"1": "Yes","0": "No"}|settings={"translate": "1"})
	*/
	protected $show_cert;

	/**
	* @Assert(null=false|int|option)
	* @Options(values={"1": "Yes","0": "No"}|settings={"translate": "1"})
	*/
	protected $show_chart_cert;

	/**
	* @Assert(null=false|int|option)
	* @Options(values={"1": "Yes","0": "No"}|settings={"translate": "1"})
	*/
	protected $show_plaque;

	function __construct()
	{
		parent::__construct();
	}

	public function __get($property)
	{
		if(!isset($this->$property) || is_null($this->$property))
		{
			return self::defaultValueFor($property);
		}
		else
		{
			return $this->$property;
		}
	}

	static function getAllDefaults()
	{
		$def = new \stdClass();

		$items = array("art_limit", "alb_limit", "mus_limit", "show_images", "show_dropouts", "show_first_image", "show_move", "show_playcounts", "lang", "alb_cert_gold", "alb_cert_platinum", "alb_cert_diamond", "mus_cert_gold", "mus_cert_platinum", "mus_cert_diamond", "show_cert", "show_chart_cert", "show_plaque");

		foreach ($items as $value) {
			$def->$value = self::defaultValueFor($value);
		}

		return $def;
	}

	static function defaultValueFor($for)
	{
		switch ($for) {
			case 'alb_cert_gold':
			case 'alb_cert_platinum':
			case 'alb_cert_diamond':
			case 'mus_cert_gold':
			case 'mus_cert_platinum':
			case 'mus_cert_diamond':
			case 'show_cert':
			case 'show_chart_cert':
			case 'show_plaque':
				$for = 0;
				break;
			case 'art_limit':
			case 'alb_limit':
			case 'mus_limit':
				$for = 10;
				break;

			case 'style':
				$for = 'chart.css';
				break;

			case 'show_images':
				$for = false;
				break;

			case 'show_dropouts':
				$for = false;
				break;

			case 'show_first_image':
				$for = true;
				break;

			case 'show_move':
				$for = C::SHOW_MOVE_PERC;
				break;

			case 'show_playcounts':
				$for = true;
				break;

			case 'lang':
				$for = Lang::detectLang();
				break;

			default:
				$for = "not found";
				break;
		}

		return $for;
	}
}
?>