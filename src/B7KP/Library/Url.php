<?php
namespace B7KP\Library;

class Url
{

	static function getFullUrl()
	{
		return "http://".$_SERVER['SERVER_NAME'].self::checkPort().$_SERVER['REQUEST_URI'];
	}

	static function getBaseUrl()
	{
		$url = "http://".$_SERVER['SERVER_NAME'].self::checkPort().dirname($_SERVER['PHP_SELF']);
		$url = rtrim($url, "/");
		return $url;
	}

	static function getRequest()
	{	
		$request = str_replace(strtolower(self::getBaseUrl()), "", strtolower(self::getFullUrl()));
		$request = explode("?", $request);
		$request = $request[0];
		return $request;
	}

	static function getParams($withpage = true)
	{
		$final = array();
		$params = self::getRequest();
		$params = explode("/", $params);
		if($withpage)
		{
			$final["page"] = $params[1];
		}
		unset($params[1]);
		foreach ($params as $value) 
		{
			if($value != "")
			{
				$final[] = $value;
			}
		}

		return $final;
	}

	static function getCurPage()
	{
		$page = self::getParams();
		return $page["page"];
	}

	static function getCurSubPage()
	{
		$page = self::getParams();
		$page = (isset($page[0]) ? $page[0] : null);
		return $page;
	}

	static function asset($to)
	{
		return self::getBaseUrl()."/web/".$to;
	}

	static function checkPort()
	{
		if($_SERVER['SERVER_PORT'] != 80)
		{
			return ":".$_SERVER['SERVER_PORT'];
		}
		
		return null;
	}

	static function changeUrl($url)
	{
		echo "
			<script>
				window.history.pushState('', '', '".$url."');
			</script>
		";
	}
}
?>