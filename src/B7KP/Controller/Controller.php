<?php
namespace B7KP\Controller;

abstract class Controller
{
	protected $factory;
	
	function __construct(MainFactory $factory)
	{
		$this->factory = $factory;
	}

	abstract protected function checkAccess();

	protected function redirectToRoute($route, $array = array())
	{
		header("location:".Route::url($route, $array));
		die();
	}

	protected function redirectToUrl($url)
	{
		header("location:".$url);
		die();
	}

	protected function refresh()
	{
		header("Refresh:0");
		die();
	}

	protected function render($file, $variables = array())
	{
		unset($variables['file']);
		extract($variables);
		include dirname(dirname(dirname(__FILE__)))."/view/".$file;
	}

	protected function createForm($formclass, $obj = null)
	{
		if(get_parent_class($formclass) == "Form")
		{
			$form = new $formclass();
			$form->build($obj);
			return $form;
		}
	}

	protected function isAjaxRequest()
	{
		// Verify if the requested data is ajax
		return !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';
	}
}
?>