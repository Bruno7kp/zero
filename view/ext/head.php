<?php
use B7KP\Library\Url;
use B7KP\Core\App;

isset($title) ?  $title = App::get("name")." - ".$title : $title = App::get("name");
?>
<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<title><?php echo $title;?></title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="stylesheet" href="<?php echo Url::asset('css/themify-icons.css');?>">
	<link rel="stylesheet" href="<?php echo Url::asset('css/bootstrap.min.css');?>">
	<link rel="stylesheet" href="<?php echo Url::asset('css/owl.carousel.min.css');?>">
	<link rel="stylesheet" href="<?php echo Url::asset('css/owl.theme.default.min.css');?>">
	<link rel="stylesheet" href="<?php echo Url::asset('css/magnific-popup.css');?>">
	<link rel="stylesheet" href="<?php echo Url::asset('css/superfish.css');?>">
	<link rel="stylesheet" href="<?php echo Url::asset('css/easy-responsive-tabs.css');?>">
	<link rel="stylesheet" href="<?php echo Url::asset('css/style.css');?>">
	<link rel="stylesheet" href="<?php echo Url::asset('lib/icomoon/style.css');?>">
	<link rel="stylesheet" href="<?php echo Url::asset('lib/font-awesome/css/font-awesome.min.css');?>">
	<link rel="stylesheet" href="<?php echo Url::asset('css/custom.css');?>">
	<link rel="stylesheet" href="<?php echo Url::asset('css/animate.css');?>">
</head>