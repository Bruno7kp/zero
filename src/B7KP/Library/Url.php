<?php
namespace B7KP\Library;

class Url
{
	static function checkHttp()
	{
		$isHttps = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') || (isset($_SERVER['SERVER_PORT']) && (int) $_SERVER['SERVER_PORT'] === 443);
		return $isHttps ? "https" : "http";
	}

	static function fix()
	{
		if(strpos($_SERVER['SERVER_NAME'], ".") > 0 && strpos($_SERVER['SERVER_NAME'], "www") === false)
		{
			header("Location: ".self::checkHttp()."://www.".$_SERVER['SERVER_NAME'].self::checkPort().$_SERVER['REQUEST_URI']);
			die();
		}
	}

	static function getFullUrl()
	{
		return self::checkHttp()."://".$_SERVER['SERVER_NAME'].self::checkPort().$_SERVER['REQUEST_URI'];
	}

	static function getBaseUrl()
	{
		$url = self::checkHttp()."://".$_SERVER['SERVER_NAME'].self::checkPort().dirname($_SERVER['PHP_SELF']);
		$url = rtrim($url, "/\\");
		return $url;
	}

	static function getRequest()
	{	
		$request = str_replace(mb_strtolower(self::getBaseUrl()), "", mb_strtolower(self::getFullUrl()));
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
