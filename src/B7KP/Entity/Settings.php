<?php
namespace B7KP\Entity;

use B7KP\Utils\Constants as C;

class Settings extends Entity
{
	/**
	* @Assert(null=false|int)
	*/
	protected $iduser;

	/**
	* @Assert(null=false|int|option)
	* @Options(values={"10": "Top 10","5": "Top 5", "15": "Top 15", "20": "Top 20", "25": "Top 25", "30": "Top 30", "40": "Top 40", "50": "Top 50", "100": "Top 100", "1": "Max"})
	*/
	protected $art_limit;

	/**
	* @Assert(null=false|int|option)
	* @Options(values={"10": "Top 10","5": "Top 5", "15": "Top 15", "20": "Top 20", "25": "Top 25", "30": "Top 30", "40": "Top 40", "50": "Top 50", "75": "Top 75", "100": "Top 100", "1": "Max"})
	*/
	protected $alb_limit;

	/**
	* @Assert(null=false|int|option)
	* @Options(values={"10": "Top 10","5": "Top 5", "15": "Top 15", "20": "Top 20", "25": "Top 25", "30": "Top 30", "40": "Top 40", "50": "Top 50", "75": "Top 75", "100": "Top 100", "1": "Max"})
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

	static function defaultValueFor($for)
	{
		switch ($for) {
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
				$for = 0;
				break;

			default:
				$for = "not found";
				break;
		}

		return $for;
	}
}
?>