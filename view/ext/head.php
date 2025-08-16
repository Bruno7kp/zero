<?php
use B7KP\Library\Url;
use B7KP\Library\Lang;
use B7KP\Core\App;
use B7KP\Utils\Theme;

isset($title) ?  $title = App::get("name")." - ".$title : $title = App::get("name");
?>
<head>

	<meta http-equiv="Content-Type" content="text/html" charset="utf-8" />
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="description" content="ZERO CHARTS - Personal / Last.fm Weekly Charts - Charts Semanais"/>
	<meta name="keywords" content="ZERO,lastfm,chart,charts,weekly,stats,tool,scrobble,music,música,semana,gráficos"/>
	<meta property="og:locale" content="pt-br"/>
	<meta property="og:title" content="<?php echo $title;?>">
	<meta property="og:image" content="https://i.imgur.com/OOKNwlp.png">
	<meta property="og:description" content="ZERO CHARTS - Personal / Last.fm Weekly Charts - Charts Semanais">
	<meta property="og:site_name" content="<?php echo App::get('name');?>">
	<meta property="og:type" content="website">
	<title><?php echo $title;?></title>
	<link rel="shortcut icon" href="https://i.imgur.com/OOKNwlp.png">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="stylesheet" href="<?php echo Url::asset('css/themify-icons.css');?>">
<?php
	$theme = Theme::getUserTheme();
	echo Theme::getThemeFiles($theme);
?>
	<!-- <link rel="stylesheet" href="<?php echo Url::asset('css/bootstrap.min.css');?>"> -->
	<!-- <link rel="stylesheet" href="https://bootswatch.com/cyborg/bootstrap.min.css"> -->
	<link rel="stylesheet" href="<?php echo Url::asset('css/owl.carousel.min.css');?>">
	<link rel="stylesheet" href="<?php echo Url::asset('css/owl.theme.default.min.css');?>">
	<link rel="stylesheet" href="<?php echo Url::asset('css/magnific-popup.css');?>">
	<link rel="stylesheet" href="<?php echo Url::asset('css/superfish.css');?>">
	<link rel="stylesheet" href="<?php echo Url::asset('css/easy-responsive-tabs.css');?>">
	<link rel="stylesheet" href="<?php echo Url::asset('css/style.css');?>">
	<link rel="stylesheet" href="<?php echo Url::asset('lib/icomoon/style.css');?>">
	<link rel="stylesheet" href="<?php echo Url::asset('lib/font-awesome/css/font-awesome.min.css');?>">
	<link rel="stylesheet" href="<?php echo Url::asset('css/custom.css?v=3.6');?>">
	<link rel="stylesheet" href="<?php echo Url::asset('css/animate.css');?>">
	<link rel="stylesheet" href="<?php echo Url::asset('css/chart.css');?>">
	<link rel="stylesheet" href="<?php echo Url::asset('css/progress.bar.css');?>">
	<link rel="stylesheet" href="<?php echo Url::asset('css/bootstrap-notifications.min.css');?>">
	<link rel="stylesheet" href="<?php echo Url::asset('fonts/flaticon/flaticon.css');?>">
	<!-- cdn -->
	<link rel="stylesheet" href="<?php echo Url::asset('css/tooltipster-blue.css');?>">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tooltipster/3.3.0/css/tooltipster.min.css">
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery.tablesorter/2.26.2/css/theme.bootstrap.min.css">
<?php
	echo Theme::getThemeFiles($theme, false);
?>
</head>