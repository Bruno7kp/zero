<?php
use B7KP\Utils\Snippets;
use B7KP\Utils\Functions as F;
use B7KP\Utils\Charts;
use B7KP\Library\Route;
use B7KP\Library\Url;
use B7KP\Library\Lang;
?>
<!doctype html>
<html>
<?php
$head = array("title" => "{$user->login} Charts");
$this->render("ext/head.php", $head);
?>
<body class="inner-min">
<?php $this->render("ext/menu.php");?>
<?php $this->render("ext/header.php", array("image" => $lfm_bg));?>
<div id="fh5co-main">
    <section>
        <div class="container">
            <div class="row bottomspace-md text-center">
                <div class="col-xs-12">
                    <?php
                    $this->render("inc/profile-menu.php", array('user' => $user, 'usericon' => $lfm_image));
                    ?>
                </div>
            </div>
            <div class="row">
                <div class="col-md-8 col-md-offset-2 text-center bottomspace-md">
                    <h3 class="topspace-sm"><?php echo Lang::get('ch_wkli');?></h3>
                    <div  class="fh5co-tab" style="display: block; width: 100%; margin: 0px;">
                        <ul class="resp-tabs-list hidden-xs">
                            <li class="resp-tab-item <?php echo $type == 'artist' ? 'resp-tab-active' : '';?>">
                                <a href="<?php echo Route::url('full_charts_list', array('login' => $user->login, 'type' => 'artist'));?>">
                                    <i class="fh5co-tab-menu-icon ti-user"></i>&nbsp;<span class="hidden-sm"><?php echo Lang::get('art');?></span>
                                </a>
                            </li>
                            <li class="resp-tab-item <?php echo $type == 'album' ? 'resp-tab-active' : '';?>">
                                <a href="<?php echo Route::url('full_charts_list', array('login' => $user->login, 'type' => 'album'));?>">
                                    <i class="fh5co-tab-menu-icon icon-vynil except"></i>&nbsp;<span class="hidden-sm"><?php echo Lang::get('alb');?></span>
                                </a>
                            </li>
                            <li class="resp-tab-item <?php echo $type == 'music' ? 'resp-tab-active' : '';?>">
                                <a href="<?php echo Route::url('full_charts_list', array('login' => $user->login, 'type' => 'music'));?>">
                                    <i class="fh5co-tab-menu-icon ti-music"></i>&nbsp;<span class="hidden-sm"><?php echo Lang::get('mus');?></span>
                                </a>
                            </li>
                        </ul>
                        <div class="resp-tabs-container divider-lr divider-bottom">
                            <?php if($type == "artist"): ?>
                                <div class="resp-tab-content resp-tab-content-active">
                                    <div class="row">
                                        <div class="col-md-12 text-center">
                                            <h2 class="h3">Top <?php echo Lang::get('art_x');?></h2>
                                        </div>
                                        <div class="col-md-12 top-artists">
                                            <?php
                                            if(is_array($weeks) && count($weeks) > 0)
                                            {
                                                $mainlink = Url::getBaseUrl()."/user/".$user->login."/charts/artist/week/";
                                                $muslink = Url::getBaseUrl()."/user/".$user->login."/music/";
                                                foreach ($weeks as $value) {
                                                    ?>
                                                    <div class="row divider-tb bottomspace-sm">
                                                        <div class="col-md-4 text-center">
                                                            <h4 class="h3 no-margin"><?php echo $value["week"]?></h4>
                                                            <small class="min-bold"><?php echo $value["from"];?></small>
                                                            <small class="min-min"><?php echo Lang::get("to");?></small>
                                                            <small class="min-bold"><?php echo $value["to"];?></small>
                                                        </div>
                                                        <div class="col-md-6 topspace-md text-center">
                                                            <?php
                                                            $weeklink = $mainlink.$value["week"];
                                                            if(is_array($value["artist"]) && count($value["artist"]) > 0)
                                                            {
                                                                $actlink = $muslink.F::fixLFM($value["artist"][0]->artist);
                                                                $r = array("login" => $user->login, "type" => "artist", "week" => $value["week"]);
                                                                $artist = $value["artist"][0];
                                                                ?>
                                                                <h4 class="h3 no-margin"><?php echo "<a href=".$actlink.">".$artist->artist."</a>";?></h4>
                                                                <?php
                                                            }
                                                            else
                                                            {
                                                                echo Lang::get('no_data');
                                                            }
                                                            ?>
                                                        </div>
                                                        <div class="col-md-2 topspace-md bottomspace-sm text-center">
                                                            <a href="<?php echo $weeklink;?>" class="btn no-margin btn-custom btn-info btn-sm"><i class="ti-stats-up"></i></a>
                                                        </div>
                                                    </div>
                                                    <?php
                                                }
                                                ?>

                                                <?php
                                            }
                                            else
                                            {
                                                echo Lang::get('no_data');
                                            }
                                            ?>
                                        </div>
                                    </div>
                                </div>
                            <?php endif; ?>
                            <?php if($type == "album"): ?>
                                <div class="resp-tab-content resp-tab-content-active">
                                    <div class="row">
                                        <div class="col-md-12 text-center">
                                            <h2 class="h3">Top <?php echo Lang::get('alb_x');?></h2>
                                        </div>
                                        <div class="col-md-12 top-albums">
                                            <?php
                                            if(is_array($weeks) && count($weeks) > 0)
                                            {
                                                $mainlink = Url::getBaseUrl()."/user/".$user->login."/charts/album/week/";
                                                $muslink = Url::getBaseUrl()."/user/".$user->login."/music/";
                                                foreach ($weeks as $value) {
                                                    ?>
                                                    <div class="row divider-tb bottomspace-sm">
                                                        <div class="col-md-4 text-center">
                                                            <h4 class="h3 no-margin"><?php echo $value["week"]?></h4>
                                                            <small class="min-bold"><?php echo $value["from"];?></small>
                                                            <small class="min-min"><?php echo Lang::get("to");?></small>
                                                            <small class="min-bold"><?php echo $value["to"];?></small>
                                                        </div>
                                                        <div class="col-md-6 text-center">
                                                            <?php
                                                            $weeklink = $mainlink.$value["week"];
                                                            if(is_array($value["album"]) && count($value["album"]) > 0)
                                                            {
                                                                $actlink = $muslink.F::fixLFM($value["album"][0]->artist);
                                                                $alblink = $muslink.F::fixLFM($value["album"][0]->artist)."/".F::fixLFM($value["album"][0]->album);
                                                                $r = array("login" => $user->login, "type" => "album", "week" => $value["week"]);
                                                                $album = $value["album"][0];
                                                                ?>
                                                                <h4 class="no-margin"><?php echo "<a href=".$alblink.">".$album->album."</a>";?></h4>
                                                                <span class="text-muted"><?php echo Lang::get('by');?></span>
                                                                <?php echo "<a href=".$actlink.">".$album->artist."</a>";?>
                                                                <?php
                                                            }
                                                            else
                                                            {
                                                                echo Lang::get('no_data');
                                                            }
                                                            ?>
                                                        </div>
                                                        <div class="col-md-2 topspace-md bottomspace-sm text-center">
                                                            <a href="<?php echo $weeklink;?>" class="btn no-margin btn-custom btn-info btn-sm"><i class="ti-stats-up"></i></a>
                                                        </div>
                                                    </div>
                                                    <?php
                                                }
                                                ?>

                                                <?php
                                            }
                                            else
                                            {
                                                echo Lang::get('no_data');
                                            }
                                            ?>
                                        </div>
                                    </div>
                                </div>
                            <?php endif; ?>
                            <?php if($type == "music"): ?>
                                <div class="resp-tab-content resp-tab-content-active">
                                    <div class="row">
                                        <div class="col-md-12 text-center">
                                            <h2 class="h3">Top <?php echo Lang::get('mus_x');?></h2>
                                        </div>
                                        <div class="col-md-12 top-musics">
                                            <?php
                                            if(is_array($weeks) && count($weeks) > 0)
                                            {
                                                $mainlink = Url::getBaseUrl()."/user/".$user->login."/charts/music/week/";
                                                $muslink = Url::getBaseUrl()."/user/".$user->login."/music/";
                                                foreach ($weeks as $value) {
                                                    ?>
                                                    <div class="row divider-tb bottomspace-sm">
                                                        <div class="col-md-4 text-center">
                                                            <h4 class="h3 no-margin"><?php echo $value["week"]?></h4>
                                                            <small class="min-bold"><?php echo $value["from"];?></small>
                                                            <small class="min-min"><?php echo Lang::get("to");?></small>
                                                            <small class="min-bold"><?php echo $value["to"];?></small>
                                                        </div>
                                                        <div class="col-md-6 text-center">
                                                            <?php
                                                            $weeklink = $mainlink.$value["week"];
                                                            if(is_array($value["music"]) && count($value["music"]) > 0)
                                                            {
                                                                $actlink = $muslink.F::fixLFM($value["music"][0]->artist);
                                                                $mlink = $muslink.F::fixLFM($value["music"][0]->artist)."/_/".F::fixLFM($value["music"][0]->music);
                                                                $r = array("login" => $user->login, "type" => "music", "week" => $value["week"]);
                                                                $music = $value["music"][0];
                                                                ?>
                                                                <h4 class="no-margin"><?php echo "<a href=".$mlink.">".$music->music."</a>";?></h4>
                                                                <span class="text-muted"><?php echo Lang::get('by');?></span>
                                                                <?php echo "<a href=".$actlink.">".$music->artist."</a>";?>
                                                                <?php
                                                            }
                                                            else
                                                            {
                                                                echo Lang::get('no_data');
                                                            }
                                                            ?>
                                                        </div>
                                                        <div class="col-md-2 topspace-md bottomspace-sm text-center">
                                                            <a href="<?php echo $weeklink;?>" class="btn no-margin btn-custom btn-info btn-sm"><i class="ti-stats-up"></i></a>
                                                        </div>
                                                    </div>
                                                    <?php
                                                }
                                                ?>

                                                <?php
                                            }
                                            else
                                            {
                                                echo Lang::get('no_data');
                                            }
                                            ?>
                                        </div>
                                    </div>
                                </div>
                            <?php endif; ?>
                        </div>
                        <br>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <?php $this->render("ext/footer.php");?>
</div>
</body>
</html>