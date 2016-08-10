<?php 
use B7KP\Library\Route;
use B7KP\Library\Lang;

$curroute = Route::gerCurRoute();
$a_prof = $a_char = $a_arti = $a_albu = $a_musi = $a_libr = $a_frie = "";
switch ($curroute) {
	case 'profile':
		$a_prof = "active";
		break;

	case 'chart_list':
	case 'full_chart_list':
	case 'weekly_chart':
	case 'live_charts':
	case 'bwp':
	case 'bwp_at':
	case 'mwa':
	case 'mia':
	case 'allkill':
	case 'b_debuts':
	case 'debuts_at':
	case 'debuts_by':
	case 'debuts_by_main':
	case 'pts_list':
	case 'user_cert_art':
	case 'plaque_gallery':
		$a_char = "active";
		break;

	case 'lib_art_list':
	case 'lib_art':
	case 'lib_art_music':
	case 'lib_art_album':
		$a_arti = "active";
		$a_libr = "active";
		$t_value = "artist";
		break;
	case 'lib_mus_list':
	case 'lib_mus':
		$a_musi = "active";
		$a_libr = "active";
		$t_value = "music";
		break;
	case 'lib_alb_list':
	case 'lib_alb':
		$a_albu = "active";
		$a_libr = "active";
		$t_value = "album";
	case 'search':
		$a_libr = "active";
		switch ($this->type) {
			case 'artist':
				$a_arti = "active";
				$t_value = "artist";
				break;

			case 'album':
				$a_albu = "active";
				$t_value = "album";
				break;
			
			default:
				$a_musi = "active";
				$t_value = "music";
				break;
		}
		break;
}
?>
<ul class="nav nav-tabs nav-center-sm">
  	<li role="presentation" class="<?php echo $a_prof;?>">
  		<a class="nav-link" href="<?php echo Route::url('profile', array('login' => $user->login));?>">
			<img height="30" width="30" class="img-circle" src="<?php echo $usericon;?>" alt="<?php echo $user->login;?>">
  		 	<span class="hidden-xs"><?php echo $user->login;?></span>
  		</a>
  	</li>
  	<li role="presentation" class="<?php echo $a_char;?>">
		<a class="nav-link" href="<?php echo Route::url('chart_list', array('login' => $user->login));?>">
			<i class="ti-stats-up"></i> 
			<span class="hidden-xs">Charts</span>
		</a>
  	</li>
  	<li role="presentation" class="<?php echo $a_libr;?>">
		<a class="nav-link" href="<?php echo Route::url('lib_art_list', array('login' => $user->login));?>">
			<i class="flaticon-music-folder"></i>
			<span class="hidden-xs"><?php echo Lang::get('library');?></span>
		</a>
  	</li>
  	<li role="presentation" class="<?php echo $a_frie;?>">
		<a class="nav-link" href="<?php echo Route::url('lib_art_list', array('login' => $user->login));?>">
			<i class="flaticon-social"></i>
			<span class="hidden-xs"><?php echo Lang::get('friends');?></span>
		</a>
  	</li>
</ul>
<?php 
if(strpos($curroute, "_list") > 0 && strpos($curroute, "lib") !== false || $curroute == "search")
{
?>
<ul class="nav nav-tabs nav-center text-center topspace-lg">
	<li role="presentation" class="<?php echo $a_arti;?>">
		<a class="nav-link" href="<?php echo Route::url('lib_art_list', array('login' => $user->login));?>">
			<i class="ti-user"></i>
			<span class="hidden-xs"><?php echo Lang::get('art_x');?></span>
		</a>
  	</li>
  	<li role="presentation" class="<?php echo $a_musi;?>">
		<a class="nav-link" href="<?php echo Route::url('lib_mus_list', array('login' => $user->login));?>">
			<i class="ti-music"></i>
			<span class="hidden-xs"><?php echo Lang::get('mus_x');?></span>
		</a>
  	</li>
  	<li role="presentation" class="<?php echo $a_albu;?>">
		<a class="nav-link" href="<?php echo Route::url('lib_alb_list', array('login' => $user->login));?>">
			<i class="icon-vynil except"></i>
			<span class="hidden-xs"><?php echo Lang::get('alb_x');?></span>
		</a>
  	</li>
</ul>
<form method="get" action="<?php echo Route::url('search', array('login' => $user->login, 'type' => $t_value));?>">
	<div class="input-group">
		<input type="text" class="form-control no-border" name="q" value="<?php echo isset($this->q) ? $this->q : '';?>">
		<div class="input-group-btn">
		    <button type="submit" class="btn btn-default btn-info"><span class="fa fa-search fa-fw"></span></button>
		</div>
	</div>
</form>
<?php
}
?>