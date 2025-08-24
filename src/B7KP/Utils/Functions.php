<?php 
namespace B7KP\Utils;

class Functions
{

	// Why? For the glory of satan of course!
	static function getFirstDayOfFirstWeekOfYear($year, $format = "Y-m-d")
	{
		$date = new \DateTime();
		$date->setISODate($year, 1, 0);
		return $date->format($format);
	}

	static function getLastDayOfLastWeekOfYear($year, $format = "Y-m-d")
	{
		$date = new \DateTime();
		$date->setISODate($year, self::weeksInYear($year), 6);
		return $date->format($format);
	}

	static function weeksInYear($year) {
	    $date = new \DateTime();
	    $date->setISODate($year, 53);
	    return ($date->format("W") === "53" ? 53 : 52);
	}

	static function correctDate($date, $format)
	{
		$date = str_replace("/", "-", $date);
		$date = new \DateTime($date);
		$date = $date->format($format);
		return $date;
	}

	static function formatNum($num){
		$num = intval($num);
		$num = $num === 0 ? "=" : sprintf("%+d", $num);
	    return $num;
	}

	static function fixLFM($name)
	{
		$name = str_replace("+", "%252B", $name);
		$name = str_replace("/", "%252F", $name);
		$name = str_replace("\\", "%255C", $name);
		$name = str_replace("#", "%23", $name);
		$name = str_replace("?", "%3F", $name);
		$name = str_replace("<", "%3C", $name);
    	$name = str_replace(">", "%3E", $name);
		$name = str_replace(" ", "+", $name);
		//var_dump($name);
		return ($name);
	}

	static function removeEmpty($array)
	{
		$final = array();
		foreach ($array as $value) 
		{
			if($value != "")
			{
				$final[] = $value;
			}
		}
		return $final;
	}

	static function extractNumber($str)
	{
		return preg_replace("/[^0-9]/","",$str);
	}

	static function getStringBetween($str, $start, $end)
	{
	    $contents = array();
		$startLength = strlen($start);
		$endLength = strlen($end);
		$startFrom = $contentStart = $contentEnd = 0;
		while (false !== ($contentStart = strpos($str, $start, $startFrom))) 
		{
			$contentStart += $startLength;
		    $contentEnd = strpos($str, $end, $contentStart);
		    if (false === $contentEnd) 
		    {
		        break;
		    }
		    $contents[] = substr($str, $contentStart, $contentEnd - $contentStart);
		    $startFrom = $contentEnd + $endLength;
		}

	    return $contents;
	}

	static function hasStringKeys(array $array) 
	{
	  	return count(array_filter(array_keys($array), 'is_string')) > 0;
	}

	static function convertStringToNumeric($str)
	{
		$num = false;
		if(is_numeric($str)) 
		{ 
			$num = $str + 0; 
		} 
		return $num; 
	}

	static function isJson($string) 
	{
	 	json_decode($string);
	 	return (json_last_error() == JSON_ERROR_NONE);
	}

	static function arrayMaker($val)
	{
		if(!is_array($val))
		{
			return (array) $val;
		}
		return $val;
	}
}
?>