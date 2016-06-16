<?php 
namespace B7KP\Library;

use B7KP\Core\Dao;
use B7KP\Core\App;
use B7KP\Model\Model;
use B7KP\Entity\User;
use B7KP\Entity\Settings;
use B7KP\Utils\UserSession;

class Lang
{
	const PT_BR = 0;
	const EN_US = 1;

	private function __construct(){}

	static function get($msg_id)
	{
		$lang = Settings::defaultValueFor('lang');
		$dao = Dao::getConn();
		$factory = new Model($dao);
		$user = UserSession::getUser($factory);
		if($user instanceof User)
		{
			$settings = $factory->findOneBy("\B7KP\Entity\Settings", $user->id, "iduser");
			if($settings instanceof Settings)
			{
				$lang = $settings->lang;
			}
		}
		$orig = $msg_id;
		$msg_id = strtolower($msg_id);
		$msg = self::messages();
		if(isset($msg[$msg_id]))
		{
			if(!isset($msg[$msg_id][$lang]))
			{
				return $msg[$msg_id][self::PT_BR];
			}
			else
			{
				return $msg[$msg_id][$lang];
			}
		}
		else
		{
			return $orig;
		}
	}

	static private function messages()
	{
		$messages = array();
		// GERAL
		$messages["mus"][self::PT_BR] = "Música";
		$messages["mus"][self::EN_US] = "Music";
		$messages["mus_x"][self::PT_BR] = "Músicas";
		$messages["mus_x"][self::EN_US] = "Musics";

		$messages["art"][self::PT_BR] = "Artista";
		$messages["art"][self::EN_US] = "Artist";
		$messages["art_x"][self::PT_BR] = "Artistas";
		$messages["art_x"][self::EN_US] = "Artists";

		$messages["alb"][self::PT_BR] = "Álbum";
		$messages["alb"][self::EN_US] = "Album";
		$messages["alb_x"][self::PT_BR] = "Álbuns";
		$messages["alb_x"][self::EN_US] = "Albums";

		$messages["sett"][self::PT_BR] = "Configurações";
		$messages["sett"][self::EN_US] = "Settings";

		$messages["reg"][self::PT_BR] = "Registrar";
		$messages["reg"][self::EN_US] = "Register";

		$messages["reg_alt"][self::PT_BR] = "Data de cadastro";
		$messages["reg_alt"][self::EN_US] = "Register date";

		$messages["about"][self::PT_BR] = "Sobre";
		$messages["about"][self::EN_US] = "About";

		$messages["home"][self::PT_BR] = "Início";
		$messages["home"][self::EN_US] = "Home";

		$messages["country"][self::PT_BR] = "País";
		$messages["country"][self::EN_US] = "Country";

		$messages["logout"][self::PT_BR] = "Sair";
		$messages["logout"][self::EN_US] = "Logout";

		$messages["prof"][self::PT_BR] = "Perfil";
		$messages["prof"][self::EN_US] = "Profile";

		$messages["click"][self::PT_BR] = "Clique";
		$messages["click"][self::EN_US] = "Click";

		$messages["title"][self::PT_BR] = "Título";
		$messages["title"][self::EN_US] = "Title";

		$messages["outof"][self::PT_BR] = "fora do chart";
		$messages["outof"][self::EN_US] = "out of the chart";

		$messages["out"][self::PT_BR] = "SAIU";
		$messages["out"][self::EN_US] = "OUT";

		$messages["click_h"][self::PT_BR] = "Clique aqui";
		$messages["click_h"][self::EN_US] = "Click here";

		$messages["view"][self::PT_BR] = "Veja mais";
		$messages["view"][self::EN_US] = "View more";

		$messages["submit"][self::PT_BR] = "Enviar";
		$messages["submit"][self::EN_US] = "Submit";

		$messages["save"][self::PT_BR] = "Salvar";
		$messages["save"][self::EN_US] = "Save";

		$messages["edit"][self::PT_BR] = "Editar";
		$messages["edit"][self::EN_US] = "Edit";

		$messages["update"][self::PT_BR] = "Atualizar";
		$messages["update"][self::EN_US] = "Update";

		$messages["remove"][self::PT_BR] = "Remover";
		$messages["remove"][self::EN_US] = "Remove";

		$messages["stats"][self::PT_BR] = "Estatísticas";
		$messages["stats"][self::EN_US] = "Stats";

		$messages["add"][self::PT_BR] = "Adicionar";
		$messages["add"][self::EN_US] = "Add";

		$messages["switchto"][self::PT_BR] = "alternar para";
		$messages["switchto"][self::EN_US] = "switch to";

		$messages["switch"][self::PT_BR] = "alternar";
		$messages["switch"][self::EN_US] = "switch";

		$messages["prev_of"][self::PT_BR] = "Chart da semana atual até o momento";
		$messages["prev_of"][self::EN_US] = "Chart of the current week to date";

		$messages["nodata_week"][self::PT_BR] = "Nenhum dado encontrado para esse semana.";
		$messages["nodata_week"][self::EN_US] = "No data found for this week.";

		$messages["previous"][self::PT_BR] = "Anterior";
		$messages["previous"][self::EN_US] = "Previous";

		$messages["next"][self::PT_BR] = "Próxima";
		$messages["next"][self::EN_US] = "Next";

		$messages["u"][self::PT_BR] = "Você";
		$messages["u"][self::EN_US] = "You";

		$messages["ur"][self::PT_BR] = "seu";
		$messages["ur"][self::EN_US] = "your";

		$messages["or"][self::PT_BR] = "ou";
		$messages["or"][self::EN_US] = "or";

		$messages["on"][self::PT_BR] = "no";
		$messages["on"][self::EN_US] = "on";

		$messages["now"][self::PT_BR] = "agora";
		$messages["now"][self::EN_US] = "now";

		$messages["hv"][self::PT_BR] = "tem";
		$messages["hv"][self::EN_US] = "have";

		$messages["by"][self::PT_BR] = "de";
		$messages["by"][self::EN_US] = "by";

		$messages["to"][self::PT_BR] = "até";
		$messages["to"][self::EN_US] = "to";

		$messages["hello"][self::PT_BR] = "Olá";
		$messages["hello"][self::EN_US] = "Hello";

		$messages["desatt"][self::PT_BR] = "desatualizada(s)";
		$messages["desatt"][self::EN_US] = "out of date";

		$messages["ch_cm"][self::PT_BR] = "Ver chart completo";
		$messages["ch_cm"][self::EN_US] = "View full chart";

		$messages["ch_li"][self::PT_BR] = "Ver lista completa";
		$messages["ch_li"][self::EN_US] = "View full list";

		$messages["ch_wkli"][self::PT_BR] = "Lista de semanas";
		$messages["ch_wkli"][self::EN_US] = "Lista of weeks";

		$messages["pass"][self::PT_BR] = "Senha";
		$messages["pass"][self::EN_US] = "Password";
		$messages["password"][self::PT_BR] = "Senha";
		$messages["password"][self::EN_US] = "Password";

		$messages["old_pass"][self::PT_BR] = "Senha atual";
		$messages["old_pass"][self::EN_US] = "Actual password";

		$messages["new_pass"][self::PT_BR] = "Nova senha";
		$messages["new_pass"][self::EN_US] = "New password";

		$messages["new_pass_repeat"][self::PT_BR] = "Repetir nova senha";
		$messages["new_pass_repeat"][self::EN_US] = "Repeat new password";

		$messages["yes"][self::PT_BR] = "Sim";
		$messages["yes"][self::EN_US] = "Yes";

		$messages["no"][self::PT_BR] = "Não";
		$messages["no"][self::EN_US] = "No";

		$messages["name"][self::PT_BR] = "Nome";
		$messages["name"][self::EN_US] = "Name";

		$messages["dropouts"][self::PT_BR] = "Saídas";
		$messages["dropouts"][self::EN_US] = "Dropouts";

		$messages["copy"][self::PT_BR] = "Copiar";
		$messages["copy"][self::EN_US] = "Copy";
		$messages["copy_w"][self::PT_BR] = "Copiar sem formatação";
		$messages["copy_w"][self::EN_US] = "Copy without formatting";

		// LOGIN
		$messages["invalid_login"][self::PT_BR] = "A senha atual está errada";
		$messages["invalid_login"][self::EN_US] = "The current password is wrong";

		$messages["invalid_user_login"][self::PT_BR] = "Usuário ou senha inválida";
		$messages["invalid_user_login"][self::EN_US] = "User or password invalid";

		$messages["min_max_login"][self::PT_BR] = "A senha deve ter entre 4 e 20 caracteres";
		$messages["min_max_login"][self::EN_US] = "The password must be between 4 and 20 characters";

		$messages["pass_dont_match"][self::PT_BR] = "A senha e sua confirmação são diferentes";
		$messages["pass_dont_match"][self::EN_US] = "The password and its confirm are not the same";

		$messages["fail_update"][self::PT_BR] = "Ocorreu um problema ao atualizar";
		$messages["fail_update"][self::EN_US] = "There was a problem updating";

		$messages["not_contain"][self::PT_BR] = "A senha não deve conter seu login";
		$messages["not_contain"][self::EN_US] = "The password should not contain your login";


		// CHART
		$messages["mov"][self::PT_BR] = "Movimento";
		$messages["mov"][self::EN_US] = "Move";
		$messages["mov_o"][self::PT_BR] = "Movimentação";
		$messages["mov_o"][self::EN_US] = "Move";
		$messages["pk"][self::PT_BR] = "Pico";
		$messages["pk"][self::EN_US] = "Peak";
		$messages["rk"][self::PT_BR] = "Posição";
		$messages["rk"][self::EN_US] = "Rank";
		$messages["wk"][self::PT_BR] = "Semana";
		$messages["wk"][self::EN_US] = "Week";
		$messages["wk_x"][self::PT_BR] = "Semanas";
		$messages["wk_x"][self::EN_US] = "Weeks";
		$messages["wk_min"][self::PT_BR] = "Sem.";
		$messages["wk_min"][self::EN_US] = "Wks";
		$messages["play"][self::PT_BR] = "Reprodução";
		$messages["play"][self::EN_US] = "Play";
		$messages["play_x"][self::PT_BR] = "Reproduções";
		$messages["play_x"][self::EN_US] = "Plays";
		$messages["scr"][self::PT_BR] = "Scrobbles";
		$messages["listener"][self::PT_BR] = "Ouvinte";
		$messages["listener"][self::EN_US] = "Listener";
		$messages["listener_x"][self::PT_BR] = "Ouvintes";
		$messages["listener_x"][self::EN_US] = "Listeners";

		$messages["entries"][self::PT_BR] = "Entradas em charts";
		$messages["entries"][self::EN_US] = "Entries in charts";

		$messages["this_act"][self::PT_BR] = "Esse artista";
		$messages["this_act"][self::EN_US] = "This artist";

		$messages["this_alb"][self::PT_BR] = "Esse álbum";
		$messages["this_alb"][self::EN_US] = "This album";

		$messages["this_mus"][self::PT_BR] = "Essa música";
		$messages["this_mus"][self::EN_US] = "This music";

		$messages["no_chart"][self::PT_BR] = "não entrou no chart";
		$messages["no_chart"][self::EN_US] = "has not entered the chart";

		$messages["user"][self::PT_BR] = "Usuário";
		$messages["user"][self::EN_US] = "User";

		$messages["user_x"][self::PT_BR] = "Usuários";
		$messages["user_x"][self::EN_US] = "Users";

		// TEXTOS/FRASESComplete the fields below and done.
		$messages["init"][self::PT_BR] = "Complete os campos abaixo e pronto. Para acessar ".App::get('name')." novamente, use seu <b>Nome de usuário</b> do last.fm e a senha que colocar logo abaixo. Nós <b>não</b> recomendamos usar a mesma senha da sua conta no Last.fm.";
		$messages["init"][self::EN_US] = "Complete the fields below and done. To access ".App::get('name')." again, use your last.fm <b>Username</b> and the new password you will insert below. We do <strong>not</strong> recomend to use the same password of your Last.fm account.";

		$messages["conn"][self::PT_BR] = "Conecte ".App::get('name')." com seu Last.fm";
		$messages["conn"][self::EN_US] = "Connect ".App::get('name')." with your Last.fm";

		$messages["wel_to"][self::PT_BR] = "Bem vindo ao";
		$messages["wel_to"][self::EN_US] = "Welcome to";

		$messages["look_at"][self::PT_BR] = "Dê uma olhada nas";
		$messages["look_at"][self::EN_US] = "Take a look at the";

		$messages["no_alb"][self::PT_BR] = "Nenhum álbum desse artista entrou nos charts.";
		$messages["no_alb"][self::EN_US] = "No albums";

		$messages["no_mus"][self::PT_BR] = "Nenhuma música desse artista entrou nos charts.";
		$messages["no_mus"][self::EN_US] = "No musics";

		$messages["up_new_week"][self::PT_BR] = "Atualizar novas semanas";
		$messages["up_new_week"][self::EN_US] = "Update new weeks";

		$messages["up_all"][self::PT_BR] = "Atualizar tudo";
		$messages["up_all"][self::EN_US] = "Update all";

		$messages["alr"][self::PT_BR] = "Já fez isso?";
		$messages["alr"][self::EN_US] = "You already did that?";

		$messages["no_data"][self::PT_BR] = "Nenhum dado para mostrar aqui.";
		$messages["no_data"][self::EN_US] = "There's no data to show here.";

		$messages["need_update"][self::PT_BR] = "Seus charts precisam estar atualizados";
		$messages["need_update"][self::EN_US] = "Your charts need to be updated";

		$messages["customize"][self::PT_BR] = "<p class='text-muted'>Aqui você pode customizar seus charts.</p>";
		$messages["customize"][self::EN_US] = "<p class='text-muted'>Here you can customize your charts.</p>";

		$messages["error_token"][self::PT_BR] = "Algo deu errado ao checar o seu token. Tente novamente mais tarde.";
		$messages["error_token"][self::EN_US] = "Something went wrong when checking the token. Try again later.";

		$messages["conf_prop"][self::PT_BR] = "Confirme que você é proprietário da conta.";
		$messages["conf_prop"][self::EN_US] = "Confirm that you're the owner of the account.";

		$messages["after_new_pass"][self::PT_BR] = "Após a confirmação da senha você será redirecionado para a página de login.";
		$messages["after_new_pass"][self::EN_US] = "After confirming the password you will be redirected to the login page.";

		$messages["type_new_pass"][self::PT_BR] = "Digite sua nova senha.";
		$messages["type_new_pass"][self::EN_US] = "Type your new password.";

		$messages["note_app"][self::PT_BR] = "Para fazer login neste site novamente, deve-se usar seu nome de usuário e sua senha, note que a senha não precisa ser a mesma do Last.fm.";
		$messages["note_app"][self::EN_US] = "To login on this site again, you must use your username and password, note that the password does not need to be the same as Last.fm.";

		$messages["sett_limit"][self::PT_BR] = "<p class='text-muted'>Aqui você pode selecionar o limite de itens para seu chart semanal. Colocando um limite, os itens que ficarem abaixo do mesmo serão ignorados na geração de seus charts.</p>";
		$messages["sett_limit"][self::EN_US] = "<p class='text-muted'>Here you can select the item limit of your weekly chart. Putting a limit, items that fall below this limit are ignored when generating your data.</p>";

		$messages["sett_diff_lw"][self::PT_BR] = "Diferença em relação a semana anterior";
		$messages["sett_diff_lw"][self::EN_US] = "Difference with last week";

		$messages["sett_none"][self::PT_BR] = "Nenhum (esconder)";
		$messages["sett_none"][self::EN_US] = "None (hide)";

		$messages["sett_lw"][self::PT_BR] = "Posição da semana anterior";
		$messages["sett_lw"][self::EN_US] = "Show last week position/plays";

		$messages["big_one"][self::PT_BR] = "Maior número de reproduções em uma semana";
		$messages["big_one"][self::EN_US] = "Largest number of plays in one week";

		$messages["big_num"][self::PT_BR] = "Maior número de semanas no";
		$messages["big_num"][self::EN_US] = "Largest number of weeks on";

		$messages["big_n"][self::PT_BR] = "Maior número de";
		$messages["big_n"][self::EN_US] = "Largest number of";

		$messages["of"][self::PT_BR] = "de";
		$messages["of"][self::EN_US] = "of";

		$messages["sett_pp"][self::PT_BR] = "Diferença em relação a semana anterior (porcentagem) (apenas para reproduções)";
		$messages["sett_pp"][self::EN_US] = "Difference with last week (percentage) (only for playcounts)";

		$messages["sett_showimg"][self::PT_BR] = "Mostrar imagens no chart";
		$messages["sett_showimg"][self::EN_US] = "Show images on the chart";

		$messages["sett_showf_img"][self::PT_BR] = "Mostrar imagens do primeiro colocado acima do chart";
		$messages["sett_showf_img"][self::EN_US] = "Show image of the number one in the top of the chart";

		$messages["sett_showdrop"][self::PT_BR] = "Mostrar itens que saíram do chart no final do mesmo";
		$messages["sett_showdrop"][self::EN_US] = "Show dropouts at the end of the chart";

		$messages["sett_move"][self::PT_BR] = "Tipo de 'movimento'";
		$messages["sett_move"][self::EN_US] = "Type of 'move'";

		$messages["not_show"][self::PT_BR] = "Nada para mostrar aqui";
		$messages["not_show"][self::EN_US] = "Nothing to show here.";

		$messages["rec_tra"][self::PT_BR] = "Faixas recentes";
		$messages["rec_tra"][self::EN_US] = "Recent tracks";

		$messages["sett_plays"][self::PT_BR] = "Mostrar número de reproduções";
		$messages["sett_plays"][self::EN_US] = "Show playcounts";

		$messages["no_edit"][self::PT_BR] = "Não há nada para editar aqui.";
		$messages["no_edit"][self::EN_US] = "There's nothing to update.";
		

		$messages["new_on"][self::PT_BR] = "Olá, parece que você é novo no Last.fm, você terá esperar até a semana terminar para aproveitar os charts semanais.";
		$messages["new_on"][self::EN_US] = "Hello, looks like you're new in last.fm, you'll have to wait till the week ends.";
		
		//def

		$messages["new_def"][self::PT_BR] = "Nova entrada no chart";
		$messages["new_def"][self::EN_US] = "New entry";

		$messages["re_def"][self::PT_BR] = "Reentrada";
		$messages["re_def"][self::EN_US] = "Re-entry";

		$messages["lw_def"][self::PT_BR] = "Posição na semana anterior";
		$messages["lw_def"][self::EN_US] = "Position in the previous week";

		$messages["last_1_x"][self::PT_BR] = "Últimos #1s";
		$messages["last_1_x"][self::EN_US] = "Latest #1s";

		$messages["not_null"][self::PT_BR] = "não pode ser vazio";
		$messages["not_null"][self::EN_US] = "can not be null";

		$messages["the_field"][self::PT_BR] = "o campo";
		$messages["the_field"][self::EN_US] = "the field";

		$messages["alfanum"][self::PT_BR] = "Apenas letras e números são acetos no campo";
		$messages["alfanum"][self::EN_US] = "Only letter and numbers are acceptable to field";

		$messages["max"][self::PT_BR] = "é o máximo de caracteres permitidos para";
		$messages["max"][self::EN_US] = "is the max number of characters permitted for";

		$messages["min"][self::PT_BR] = "é o mínimo de caracteres permitidos para";
		$messages["min"][self::EN_US] = "is the min. number of characters permitted for";
		
		$messages["invalid"][self::PT_BR] = "inválido";
		$messages["invalid"][self::EN_US] = "invalid";

		$messages["the"][self::PT_BR] = "O";
		$messages["the"][self::EN_US] = "The";

		$messages["in"][self::PT_BR] = "em";
		$messages["in"][self::EN_US] = "in";

		$messages["at"][self::PT_BR] = "no";
		$messages["at"][self::EN_US] = "at";

		$messages["in_use"][self::PT_BR] = "já está em uso";
		$messages["in_use"][self::EN_US] = "is already in use";

		$messages["forg_pass"][self::PT_BR] = "Esqueceu sua senha?";
		$messages["forg_pass"][self::EN_US] = "Forgot password?";

		$messages["type_user"][self::PT_BR] = "Digite seu nome de usuário";
		$messages["type_user"][self::EN_US] = "Type your username";

		$messages["acc_not_exists"][self::PT_BR] = "Esta conta não está cadastrada. Para se cadastrar";
		$messages["acc_not_exists"][self::EN_US] = "This account is not registered. To register";

		$messages["integer"][self::PT_BR] = "deve ser um número inteiro";
		$messages["integer"][self::EN_US] = "must be an integer";

		$messages["be_number"][self::PT_BR] = "deve ser um número";
		$messages["be_number"][self::EN_US] = "must be a number";

		$messages["lower"][self::PT_BR] = "deve ser menor que";
		$messages["lower"][self::EN_US] = "must be lower than";

		$messages["bigger"][self::PT_BR] = "deve ser maior que";
		$messages["bigger"][self::EN_US] = "must be bigger than";

		$messages["bigger"][self::PT_BR] = "deve ser igual a";
		$messages["bigger"][self::EN_US] = "must be equal to";

		$messages["inv_value"][self::PT_BR] = "Valor inválido no campo";
		$messages["inv_value"][self::EN_US] = "Invalid value in field";

		$messages["must_cn"][self::PT_BR] = "deve conter";
		$messages["must_cn"][self::EN_US] = "must contain";

		$messages["must_cn"][self::PT_BR] = "não deve conter";
		$messages["must_cn"][self::EN_US] = "must not contain";

		$messages["equal_to"][self::PT_BR] = "deve ser igual a";
		$messages["equal_to"][self::EN_US] = "must be equal to the";

		$messages["diff_to"][self::PT_BR] = "deve ser diferente de";
		$messages["diff_to"][self::EN_US] = "must be different of the";

		$messages["field"][self::PT_BR] = "campo";
		$messages["field"][self::EN_US] = "field";

		$messages["same_val"][self::PT_BR] = "não pode conter o mesmo valor de";
		$messages["same_val"][self::EN_US] = "should not contain the same value of the";

		$messages["opt_field"][self::PT_BR] = "Opção do campo";
		$messages["opt_field"][self::EN_US] = "Option of the field";

		$messages["opt_not"][self::PT_BR] = "não disponível, tente recarregar a página e selecione a opção novamente.";
		$messages["opt_not"][self::EN_US] = "not available, try reload the page and select an option again.";

		$messages["last_user"][self::PT_BR] = "Usuário do Last.fm não encontrado.";
		$messages["last_user"][self::EN_US] = "Last.fm username not found";

		$messages["live_chart"][self::PT_BR] = "Acompanhe como está o chart da semana atual até o momento.";
		$messages["live_chart"][self::EN_US] = "";

		return $messages;
	}

}
?>