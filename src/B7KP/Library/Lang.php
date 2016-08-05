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

	static function getLangs()
	{
		$ref = new \ReflectionClass(__CLASS__);
        return $ref->getConstants();
	}

	static function getLangCode($id)
	{
		$code = 'en-US';
		if($id == self::PT_BR){
			$code = 'pt-BR';
		}

		return $code;
	}

	static function detectLang()
	{
		$mainlang = "en";
		$acceptLanguage = $_SERVER['HTTP_ACCEPT_LANGUAGE'];
		$langs = array();
		foreach( explode(',', $acceptLanguage) as $lang) 
		{
		    $lang = explode(';q=', $lang);
		    $langs[$lang[0]] = count($lang)>1?floatval($lang[1]):1;
		}
		arsort($langs);
		foreach ($langs as $key => $value) 
		{
			$mainlang = $key;
			break;
		}
		$mainlang = substr($mainlang, 0, 2);

		switch ($mainlang) {
			case 'pt':
				$detected = self::PT_BR;
				break;

			default:
				$detected = self::EN_US;
				break;

		}

		return $detected;
	}

	static function getUserLang()
	{
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
			else
			{
				$lang = self::detectLang();
			}
		}
		else
		{
			$lang = self::detectLang();
		}

		return $lang;
	}

	static function get($msg_id)
	{
		$lang = self::getUserLang();
		//$lang = Settings::defaultValueFor('lang');
		
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

		// PRINCIPAL 1
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

		// PRINCIPAL 2
		$messages["about"][self::PT_BR] = "Sobre";
		$messages["about"][self::EN_US] = "About";

		$messages["add"][self::PT_BR] = "Adicionar";
		$messages["add"][self::EN_US] = "Add";

		$messages["click"][self::PT_BR] = "Clique";
		$messages["click"][self::EN_US] = "Click";

		$messages["click_h"][self::PT_BR] = "Clique aqui";
		$messages["click_h"][self::EN_US] = "Click here";
		
		$messages["country"][self::PT_BR] = "País";
		$messages["country"][self::EN_US] = "Country";

		$messages["edit"][self::PT_BR] = "Editar";
		$messages["edit"][self::EN_US] = "Edit";
		
		$messages["home"][self::PT_BR] = "Início";
		$messages["home"][self::EN_US] = "Home";

		$messages["language"][self::PT_BR] = "Idioma do site";
		$messages["language"][self::EN_US] = "Site language";

		$messages["logout"][self::PT_BR] = "Sair";
		$messages["logout"][self::EN_US] = "Logout";

		$messages["next"][self::PT_BR] = "Próxima";
		$messages["next"][self::EN_US] = "Next";

		$messages["notifications"][self::PT_BR] = "Notificações";
		$messages["notifications"][self::EN_US] = "Notifications";

		$messages["previous"][self::PT_BR] = "Anterior";
		$messages["previous"][self::EN_US] = "Previous";
		
		$messages["prof"][self::PT_BR] = "Perfil";
		$messages["prof"][self::EN_US] = "Profile";

		$messages["reg"][self::PT_BR] = "Registrar";
		$messages["reg"][self::EN_US] = "Register";

		$messages["reg_alt"][self::PT_BR] = "Data de cadastro";
		$messages["reg_alt"][self::EN_US] = "Register date";

		$messages["remove"][self::PT_BR] = "Remover";
		$messages["remove"][self::EN_US] = "Remove";

		$messages["save"][self::PT_BR] = "Salvar";
		$messages["save"][self::EN_US] = "Save";
		
		$messages["sett"][self::PT_BR] = "Configurações";
		$messages["sett"][self::EN_US] = "Settings";

		$messages["submit"][self::PT_BR] = "Enviar";
		$messages["submit"][self::EN_US] = "Submit";
		
		$messages["stats"][self::PT_BR] = "Estatísticas";
		$messages["stats"][self::EN_US] = "Stats";
		
		$messages["title"][self::PT_BR] = "Título";
		$messages["title"][self::EN_US] = "Title";

		$messages["u"][self::PT_BR] = "Você";
		$messages["u"][self::EN_US] = "You";

		$messages["user"][self::PT_BR] = "Usuário";
		$messages["user"][self::EN_US] = "User";

		$messages["user_x"][self::PT_BR] = "Usuários";
		$messages["user_x"][self::EN_US] = "Users";

		$messages["update"][self::PT_BR] = "Atualizar";
		$messages["update"][self::EN_US] = "Update";
		
		$messages["view"][self::PT_BR] = "Veja mais";
		$messages["view"][self::EN_US] = "View more";

		// IMPORTANTE

		$messages["acc_success"][self::PT_BR] = "Conta resetada com sucesso";
		$messages["acc_success"][self::EN_US] = "Success";

		$messages["acc_success_rem"][self::PT_BR] = "Conta removida com sucesso";
		$messages["acc_success_rem"][self::EN_US] = "Success";

		$messages["cert"][self::PT_BR] = "Certificações";
		$messages["cert"][self::EN_US] = "Certifications";

		$messages["cert_s"][self::PT_BR] = "Certificação";
		$messages["cert_s"][self::EN_US] = "Certification";

		$messages["cert_o"][self::PT_BR] = "Certificados";
		$messages["cert_o"][self::EN_US] = "Certifications";

		$messages["copy"][self::PT_BR] = "Copiar";
		$messages["copy"][self::EN_US] = "Copy";

		$messages["copy_w"][self::PT_BR] = "Copiar sem formatação";
		$messages["copy_w"][self::EN_US] = "Copy without formatting";

		$messages["change_start_date"][self::PT_BR] = "Alterar dia de início do chart";
		$messages["change_start_date"][self::EN_US] = "Change start day of the chart";
		
		$messages["ch_cm"][self::PT_BR] = "Ver chart completo";
		$messages["ch_cm"][self::EN_US] = "View full chart";

		$messages["ch_li"][self::PT_BR] = "Ver lista completa";
		$messages["ch_li"][self::EN_US] = "View full list";

		$messages["ch_wkli"][self::PT_BR] = "Lista de semanas";
		$messages["ch_wkli"][self::EN_US] = "Lista of weeks";

		$messages["diam"][self::PT_BR] = "Diamante";
		$messages["diam"][self::EN_US] = "Diamond";
		
		$messages["dropouts"][self::PT_BR] = "Saídas";
		$messages["dropouts"][self::EN_US] = "Dropouts";

		$messages["filter_rank"][self::PT_BR] = "Filtre por posição";
		$messages["filter_rank"][self::EN_US] = "Filter by position";

		$messages["filter"][self::PT_BR] = "Filtro";
		$messages["filter"][self::EN_US] = "Filter";

		$messages["friday"][self::PT_BR] = "Sexta-feira";
		$messages["friday"][self::EN_US] = "Friday";

		$messages["friend"][self::PT_BR] = "amigo";
		$messages["friend"][self::EN_US] = "friend";

		$messages["friends"][self::PT_BR] = "Amigos";
		$messages["friends"][self::EN_US] = "Friends";

		$messages["fri_or_sun"][self::PT_BR] = "Agora você pode escolher o dia de início do seu chart, Sexta ou Domingo?";
		$messages["fri_or_sun"][self::EN_US] = "Now you can choose the starting day of your chart, Friday or Sunday?";

		$messages["gold"][self::PT_BR] = "Ouro";
		$messages["gold"][self::EN_US] = "Gold";

		$messages["hello"][self::PT_BR] = "Olá";
		$messages["hello"][self::EN_US] = "Hello";

		$messages["here"][self::PT_BR] = "aqui";
		$messages["here"][self::EN_US] = "here";

		$messages["library"][self::PT_BR] = "Biblioteca";
		$messages["library"][self::EN_US] = "Library";

		$messages["name"][self::PT_BR] = "Nome";
		$messages["name"][self::EN_US] = "Name";

		$messages["new_pass"][self::PT_BR] = "Nova senha";
		$messages["new_pass"][self::EN_US] = "New password";
		
		$messages["new_pass_repeat"][self::PT_BR] = "Repetir nova senha";
		$messages["new_pass_repeat"][self::EN_US] = "Repeat new password";
				
		$messages["next_upd"][self::PT_BR] = "Próxima atualização";
		$messages["next_upd"][self::EN_US] = "Next update";

		$messages["no"][self::PT_BR] = "Não";
		$messages["no"][self::EN_US] = "No";

		$messages["nodata_week"][self::PT_BR] = "Nenhum dado encontrado para esse semana.";
		$messages["nodata_week"][self::EN_US] = "No data found for this week.";

		$messages["none"][self::PT_BR] = "Nenhum";
		$messages["none"][self::EN_US] = "None";
		
		$messages["old_pass"][self::PT_BR] = "Senha atual";
		$messages["old_pass"][self::EN_US] = "Actual password";
		
		$messages["out"][self::PT_BR] = "SAIU";
		$messages["out"][self::EN_US] = "OUT";

		$messages["outof"][self::PT_BR] = "fora do chart";
		$messages["outof"][self::EN_US] = "out of the chart";
		
		$messages["pass"][self::PT_BR] = "Senha";
		$messages["pass"][self::EN_US] = "Password";
		$messages["password"][self::PT_BR] = "Senha";
		$messages["password"][self::EN_US] = "Password";

		$messages["plaque"][self::PT_BR] = "Placas de certificados";
		$messages["plaque"][self::EN_US] = "Certifications plaques";

		$messages["plat"][self::PT_BR] = "Platina";
		$messages["plat"][self::EN_US] = "Platinum";
		
		$messages["prev_of"][self::PT_BR] = "Chart da semana atual até o momento";
		$messages["prev_of"][self::EN_US] = "Chart of the current week to date";

		$messages["reset_acc"][self::PT_BR] = "Resetar conta";
		$messages["reset_acc"][self::EN_US] = "Reset account";

		$messages["reset_acc_txt"][self::PT_BR] = "Ao resetar sua conta, todos os seus charts semanais serão apagados, as configurações e placas continuarão iguais.";
		$messages["reset_acc_txt"][self::EN_US] = "All your weekly charts will be deleted, settings and plaques will remain in place.";

		$messages["reset_account"][self::PT_BR] = "Resetar/deletar conta";
		$messages["reset_account"][self::EN_US] = "Reset/delete account";

		$messages["reset_weeks"][self::PT_BR] = "Para alterar o dia de início dos charts, é preciso resetar sua conta (excluir os charts já gerados). Resete sua conta";
		$messages["reset_weeks"][self::EN_US] = "To change the starting day of the charts, you need to reset your account (excluding the charts already generated). Reset your account";

		$messages["remove_acc"][self::PT_BR] = "Remover conta";
		$messages["remove_acc"][self::EN_US] = "Remove account";

		$messages["remove_acc_txt"][self::PT_BR] = "Ao remover sua conta, todos os seus dados serão apagados, você poderá se cadastrar novamente com a mesma conta a qualquer momento.";
		$messages["remove_acc_txt"][self::EN_US] = "When removing your account, all your data will be deleted, you can register again with the same account at any time.";

		$messages["sum"][self::PT_BR] = "Soma";
		$messages["sum"][self::EN_US] = "Sum";

		$messages["sunday"][self::PT_BR] = "Domingo";
		$messages["sunday"][self::EN_US] = "Sunday";

		$messages["start_day"][self::PT_BR] = "Dia de início do chart semanal";
		$messages["start_day"][self::EN_US] = "Weekly beginning chart day";

		$messages["stay_logged"][self::PT_BR] = "Permanecer conectado";
		$messages["stay_logged"][self::EN_US] = "Stay connected";

		$messages["total"][self::PT_BR] = "Total";
		$messages["total"][self::EN_US] = "Total";

		$messages["unique"][self::PT_BR] = "Único";
		$messages["unique"][self::EN_US] = "Unique";
		
		$messages["up_all"][self::PT_BR] = "Atualizar tudo";
		$messages["up_all"][self::EN_US] = "Update all";

		$messages["up_new_week"][self::PT_BR] = "Atualizar novas semanas";
		$messages["up_new_week"][self::EN_US] = "Update new weeks";

		$messages["username"][self::PT_BR] = "Nome de usuário";
		$messages["username"][self::EN_US] = "Username";

		$messages["version"][self::PT_BR] = "Versão";
		$messages["version"][self::EN_US] = "Version";

		$messages["yes"][self::PT_BR] = "Sim";
		$messages["yes"][self::EN_US] = "Yes";

		$messages["weight"][self::PT_BR] = "Peso";
		$messages["weight"][self::EN_US] = "Weight";

		$messages["weighted"][self::PT_BR] = "Ponderado";
		$messages["weighted"][self::EN_US] = "Weighted";
		
		// MEIA FRASE

		$messages["acc_not_exists"][self::PT_BR] = "Esta conta não está cadastrada. Para se cadastrar";
		$messages["acc_not_exists"][self::EN_US] = "This account is not registered. To register";
		
		$messages["alfanum"][self::PT_BR] = "Apenas letras e números são acetos no campo";
		$messages["alfanum"][self::EN_US] = "Only letter and numbers are acceptable to field";

		$messages["be_number"][self::PT_BR] = "deve ser um número";
		$messages["be_number"][self::EN_US] = "must be a number";

		$messages["bigger"][self::PT_BR] = "deve ser maior que";
		$messages["bigger"][self::EN_US] = "must be bigger than";

		$messages["bigger_to"][self::PT_BR] = "deve ser maior que";
		$messages["bigger_to"][self::EN_US] = "must be bigger than";

		$messages["big_n"][self::PT_BR] = "Maior número de";
		$messages["big_n"][self::EN_US] = "Largest number of";
		
		$messages["big_num"][self::PT_BR] = "Maior número de semanas no";
		$messages["big_num"][self::EN_US] = "Largest number of weeks on";
		
		$messages["desatt"][self::PT_BR] = "desatualizada(s)";
		$messages["desatt"][self::EN_US] = "out of date";

		$messages["diff_to"][self::PT_BR] = "deve ser diferente de";
		$messages["diff_to"][self::EN_US] = "must be different of the";
		
		$messages["equal_to"][self::PT_BR] = "deve ser igual a";
		$messages["equal_to"][self::EN_US] = "must be equal to the";

		$messages["inside_of_top"][self::PT_BR] = "dentro do top";
		$messages["inside_of_top"][self::EN_US] = "inside of the top";

		$messages["integer"][self::PT_BR] = "deve ser um número inteiro";
		$messages["integer"][self::EN_US] = "must be an integer";

		$messages["inv_value"][self::PT_BR] = "Valor inválido no campo";
		$messages["inv_value"][self::EN_US] = "Invalid value in field";

		$messages["in_use"][self::PT_BR] = "já está em uso";
		$messages["in_use"][self::EN_US] = "is already in use";

		$messages["look_at"][self::PT_BR] = "Dê uma olhada nas";
		$messages["look_at"][self::EN_US] = "Take a look at the";

		$messages["lower"][self::PT_BR] = "deve ser menor que";
		$messages["lower"][self::EN_US] = "must be lower than";
		
		$messages["max"][self::PT_BR] = "é o máximo de caracteres permitidos para";
		$messages["max"][self::EN_US] = "is the max number of characters permitted for";

		$messages["min"][self::PT_BR] = "é o mínimo de caracteres permitidos para";
		$messages["min"][self::EN_US] = "is the min. number of characters permitted for";
		
		$messages["must_cn"][self::PT_BR] = "deve conter";
		$messages["must_cn"][self::EN_US] = "must contain";

		$messages["must_n_cn"][self::PT_BR] = "não deve conter";
		$messages["must_n_cn"][self::EN_US] = "must not contain";

		$messages["no_chart"][self::PT_BR] = "não entrou no chart";
		$messages["no_chart"][self::EN_US] = "has not entered the chart";

		$messages["not_null"][self::PT_BR] = "não pode ser vazio";
		$messages["not_null"][self::EN_US] = "can not be null";

		$messages["opt_field"][self::PT_BR] = "Opção do campo";
		$messages["opt_field"][self::EN_US] = "Option of the field";

		$messages["opt_not"][self::PT_BR] = "não disponível, tente recarregar a página e selecione a opção novamente.";
		$messages["opt_not"][self::EN_US] = "not available, try reload the page and select an option again.";
		
		$messages["out_of_top"][self::PT_BR] = "fora do top";
		$messages["out_of_top"][self::EN_US] = "out of the top";

		$messages["same_val"][self::PT_BR] = "não pode conter o mesmo valor de";
		$messages["same_val"][self::EN_US] = "should not contain the same value of the";

		$messages["switchto"][self::PT_BR] = "alternar para";
		$messages["switchto"][self::EN_US] = "switch to";
		
		$messages["the_field"][self::PT_BR] = "o campo";
		$messages["the_field"][self::EN_US] = "the field";

		$messages["theme"][self::PT_BR] = "Tema";
		$messages["theme"][self::EN_US] = "Theme";

		$messages["this_act"][self::PT_BR] = "Esse artista";
		$messages["this_act"][self::EN_US] = "This artist";

		$messages["this_alb"][self::PT_BR] = "Esse álbum";
		$messages["this_alb"][self::EN_US] = "This album";

		$messages["this_mus"][self::PT_BR] = "Essa música";
		$messages["this_mus"][self::EN_US] = "This music";
		
		$messages["wel_to"][self::PT_BR] = "Bem vindo ao";
		$messages["wel_to"][self::EN_US] = "Welcome to";

		// COMPLEMENTO

		$messages["by"][self::PT_BR] = "de";
		$messages["by"][self::EN_US] = "by";

		$messages["field"][self::PT_BR] = "campo";
		$messages["field"][self::EN_US] = "field";

		$messages["hv"][self::PT_BR] = "tem";
		$messages["hv"][self::EN_US] = "have";

		$messages["invalid"][self::PT_BR] = "inválido";
		$messages["invalid"][self::EN_US] = "invalid";

		$messages["now"][self::PT_BR] = "agora";
		$messages["now"][self::EN_US] = "now";

		$messages["of"][self::PT_BR] = "de";
		$messages["of"][self::EN_US] = "of";

		$messages["on"][self::PT_BR] = "no";
		$messages["on"][self::EN_US] = "on";

		$messages["or"][self::PT_BR] = "ou";
		$messages["or"][self::EN_US] = "or";
		
		$messages["ur"][self::PT_BR] = "seu";
		$messages["ur"][self::EN_US] = "your";

		$messages["to"][self::PT_BR] = "até";
		$messages["to"][self::EN_US] = "to";

		$messages["the"][self::PT_BR] = "O";
		$messages["the"][self::EN_US] = "The";

		$messages["in"][self::PT_BR] = "em";
		$messages["in"][self::EN_US] = "in";

		$messages["at"][self::PT_BR] = "no";
		$messages["at"][self::EN_US] = "at";

		// MENOS IMPORTANTE

		$messages["complete"][self::PT_BR] = "completo";
		$messages["complete"][self::EN_US] = "complete";

		$messages["switch"][self::PT_BR] = "alternar";
		$messages["switch"][self::EN_US] = "switch";

		// LOGIN

		$messages["fail_update"][self::PT_BR] = "Ocorreu um problema ao atualizar";
		$messages["fail_update"][self::EN_US] = "There was a problem updating";

		$messages["invalid_login"][self::PT_BR] = "A senha atual está errada";
		$messages["invalid_login"][self::EN_US] = "The current password is wrong";

		$messages["invalid_user_login"][self::PT_BR] = "Usuário ou senha inválida";
		$messages["invalid_user_login"][self::EN_US] = "User or password invalid";

		$messages["min_max_login"][self::PT_BR] = "A senha deve ter entre 4 e 20 caracteres";
		$messages["min_max_login"][self::EN_US] = "The password must be between 4 and 20 characters";

		$messages["not_available"][self::PT_BR] = "Cadastros desabilitados no momento. Volte em algumas horas.";
		$messages["not_available"][self::EN_US] = "User registration is disabled at the time. Come back in a few hours.";

		$messages["not_contain"][self::PT_BR] = "A senha não deve conter seu login";
		$messages["not_contain"][self::EN_US] = "The password should not contain your login";

		$messages["pass_dont_match"][self::PT_BR] = "A senha e sua confirmação são diferentes";
		$messages["pass_dont_match"][self::EN_US] = "The password and its confirm are not the same";

		// CHART

		$messages["entries"][self::PT_BR] = "Entradas em charts";
		$messages["entries"][self::EN_US] = "Entries in charts";
		
		$messages["listener"][self::PT_BR] = "Ouvinte";
		$messages["listener"][self::EN_US] = "Listener";

		$messages["listener_x"][self::PT_BR] = "Ouvintes";
		$messages["listener_x"][self::EN_US] = "Listeners";

		$messages["new_def"][self::PT_BR] = "Nova entrada no chart";
		$messages["new_def"][self::EN_US] = "New entry";

		$messages["mov"][self::PT_BR] = "Movimento";
		$messages["mov"][self::EN_US] = "Move";

		$messages["mov_o"][self::PT_BR] = "Movimentação";
		$messages["mov_o"][self::EN_US] = "Move";

		$messages["play"][self::PT_BR] = "Reprodução";
		$messages["play"][self::EN_US] = "Play";

		$messages["play_x"][self::PT_BR] = "Reproduções";
		$messages["play_x"][self::EN_US] = "Plays";

		$messages["pk"][self::PT_BR] = "Pico";
		$messages["pk"][self::EN_US] = "Peak";

		$messages["pt"][self::PT_BR] = "Ponto";
		$messages["pt"][self::EN_US] = "Point";

		$messages["pt_x"][self::PT_BR] = "Pontos";
		$messages["pt_x"][self::EN_US] = "Points";

		$messages["re_def"][self::PT_BR] = "Reentrada";
		$messages["re_def"][self::EN_US] = "Re-entry";

		$messages["rk"][self::PT_BR] = "Posição";
		$messages["rk"][self::EN_US] = "Rank";

		$messages["scr"][self::PT_BR] = "Scrobbles";
		$messages["scr"][self::EN_US] = "Scrobbles";

		$messages["wk"][self::PT_BR] = "Semana";
		$messages["wk"][self::EN_US] = "Week";

		$messages["wk_x"][self::PT_BR] = "Semanas";
		$messages["wk_x"][self::EN_US] = "Weeks";

		$messages["wk_min"][self::PT_BR] = "Sem.";
		$messages["wk_min"][self::EN_US] = "Wks";

		// TEXTOS/FRASES

		$messages["after_new_pass"][self::PT_BR] = "Após a confirmação da senha você será redirecionado para a página de login.";
		$messages["after_new_pass"][self::EN_US] = "After confirming the password you will be redirected to the login page.";

		$messages["alb_cert"][self::PT_BR] = "Valores para certificados de álbuns";
		$messages["alb_cert"][self::EN_US] = "Values ​​for albums certificates";

		$messages["allkill"][self::PT_BR] = "Artistas que ficaram em #1 em todos os charts na mesma semana";
		$messages["allkill"][self::EN_US] = "All-kill";
		
		$messages["alr"][self::PT_BR] = "Já fez isso?";
		$messages["alr"][self::EN_US] = "You already did that?";
		
		$messages["art_alb_mus"][self::PT_BR] = "Artistas com mais músicas/álbuns em #1";
		$messages["art_alb_mus"][self::EN_US] = "Artists with more musics/albums at #1";

		$messages["big_debut"][self::PT_BR] = "Maiores estreias (debuts)";
		$messages["big_debut"][self::EN_US] = "Biggest debuts";

		$messages["big_debut_one"][self::PT_BR] = "Maior número de estreias";
		$messages["big_debut_one"][self::EN_US] = "Largest number of debuts";

		$messages["big_one"][self::PT_BR] = "Maior número de reproduções em uma semana";
		$messages["big_one"][self::EN_US] = "Largest number of plays in one week";

		$messages["big_one_cert"][self::PT_BR] = "Artistas com maior número de certificados";
		$messages["big_one_cert"][self::EN_US] = "Artists with the most certificates";

		$messages["big_debut_art"][self::PT_BR] = "Artistas com mais músicas/álbuns que estrearam em #1";
		$messages["big_debut_art"][self::EN_US] = "Artists with more musics/albums which debuted at #1";

		$messages["by_art"][self::PT_BR] = "Por artista";
		$messages["by_art"][self::EN_US] = "By artist";

		$messages["by_wk"][self::PT_BR] = "Por semana";
		$messages["by_wk"][self::EN_US] = "By week";

		$messages["by_cert"][self::PT_BR] = "Por certificado";
		$messages["by_cert"][self::EN_US] = "By certified";
		
		$messages["cert_exp"][self::PT_BR] = "Os certificados podem ser baseados em número de reproduções ou pontos. Os pontos são feitos atribuindo um valor para cada posição que o álbum/música alcançou. Ex: uma música que tem três semanas no chart, com as posições #1, #2 e #3, receberá 100, 98 e 96 pontos respectivamente, totalizando 294 pontos.";
		$messages["cert_exp"][self::EN_US] = "Certifications can be based on number of plays or points. The points are made by assigning a value to each position that the album / song reached. Ex: a song that has three weeks in the chart, with positions #1, #2 and #3, will receive 100, 98 and 96 points respectively, totaling 294 points.";

		$messages["cert_type"][self::PT_BR] = "Os certificados serão baseados em número de reproduções ou pontos?";
		$messages["cert_type"][self::EN_US] = "The certifications will be based on number of plays or points?";

		$messages["chart_points"][self::PT_BR] = "Veja a pontuação de cada artista/álbum/música conquistou pelo seu desempenhos nos charts";
		$messages["chart_points"][self::EN_US] = "See the points of each artist / album / song won for their performances in the charts";

		$messages["conf_prop"][self::PT_BR] = "Confirme que você é proprietário da conta.";
		$messages["conf_prop"][self::EN_US] = "Confirm that you're the owner of the account.";

		$messages["conn"][self::PT_BR] = "Conecte ".App::get('name')." com seu Last.fm";
		$messages["conn"][self::EN_US] = "Connect ".App::get('name')." with your Last.fm";

		$messages["customize"][self::PT_BR] = "<p class='text-muted'>Aqui você pode customizar seus charts.</p>";
		$messages["customize"][self::EN_US] = "<p class='text-muted'>Here you can customize your charts.</p>";

		$messages["error_token"][self::PT_BR] = "Algo deu errado ao checar o seu token. Tente novamente mais tarde.";
		$messages["error_token"][self::EN_US] = "Something went wrong when checking the token. Try again later.";

		$messages["forg_pass"][self::PT_BR] = "Esqueceu sua senha?";
		$messages["forg_pass"][self::EN_US] = "Forgot password?";

		$messages["gen_plaque"][self::PT_BR] = "Gerar placa de certificado";
		$messages["gen_plaque"][self::EN_US] = "Create certification plaque";

		$messages["hide_livechart"][self::PT_BR] = "Esconder 'Live Chart'";
		$messages["hide_livechart"][self::EN_US] = "Hide 'Live Chart'";
		
		$messages["init"][self::PT_BR] = "Complete os campos abaixo e pronto. Para acessar ".App::get('name')." novamente, use seu <b>Nome de usuário</b> do last.fm e a senha que colocar logo abaixo. Nós <b>não</b> recomendamos usar a mesma senha da sua conta no Last.fm.";
		$messages["init"][self::EN_US] = "Complete the fields below and done. To access ".App::get('name')." again, use your last.fm <b>Username</b> and the new password you will insert below. We do <b>not</b> recomend to use the same password of your Last.fm account.";

		$messages["last_1_x"][self::PT_BR] = "Últimos #1s";
		$messages["last_1_x"][self::EN_US] = "Latest #1s";

		$messages["last_user"][self::PT_BR] = "Usuário do Last.fm não encontrado.";
		$messages["last_user"][self::EN_US] = "Last.fm username not found";

		$messages["live_chart"][self::PT_BR] = "Acompanhe como está o chart da semana atual até o momento.";
		$messages["live_chart"][self::EN_US] = "See a preview of the chart of this week";

		$messages["lw_def"][self::PT_BR] = "Posição/reproduções na semana anterior";
		$messages["lw_def"][self::EN_US] = "Position/plays in the previous week";

		$messages["mus_cert"][self::PT_BR] = "Valores para certificados de músicas";
		$messages["mus_cert"][self::EN_US] = "Values ​​for musics certificates";

		$messages["need_update"][self::PT_BR] = "Seus charts precisam estar atualizados";
		$messages["need_update"][self::EN_US] = "Your charts need to be updated";

		$messages["new_on"][self::PT_BR] = "Olá, parece que você é novo no Last.fm, você terá esperar até a semana terminar para aproveitar os charts semanais.";
		$messages["new_on"][self::EN_US] = "Hello, looks like you're new in last.fm, you'll have to wait till the week ends.";

		$messages["no_edit"][self::PT_BR] = "Não há nada para editar aqui.";
		$messages["no_edit"][self::EN_US] = "There's nothing to update.";

		$messages["note_app"][self::PT_BR] = "Para fazer login neste site novamente, deve-se usar seu nome de usuário e sua senha, note que a senha não precisa ser a mesma do Last.fm.";
		$messages["note_app"][self::EN_US] = "To login on this site again, you must use your username and password, note that the password does not need to be the same as Last.fm.";

		$messages["no_alb"][self::PT_BR] = "Nenhum álbum desse artista entrou nos charts.";
		$messages["no_alb"][self::EN_US] = "No albums";

		$messages["no_data"][self::PT_BR] = "Nenhum dado para mostrar aqui.";
		$messages["no_data"][self::EN_US] = "There's no data to show here.";

		$messages["no_mus"][self::PT_BR] = "Nenhuma música desse artista entrou nos charts.";
		$messages["no_mus"][self::EN_US] = "No musics";

		$messages["not_show"][self::PT_BR] = "Nada para mostrar aqui";
		$messages["not_show"][self::EN_US] = "Nothing to show here.";

		$messages["rec_tra"][self::PT_BR] = "Faixas recentes";
		$messages["rec_tra"][self::EN_US] = "Recent tracks";

		$messages["sett_diff_lw"][self::PT_BR] = "Diferença em relação a semana anterior";
		$messages["sett_diff_lw"][self::EN_US] = "Difference with last week";

		$messages["sett_limit"][self::PT_BR] = "<p class='text-muted'>Aqui você pode selecionar o limite de itens para seu chart semanal. Colocando um limite, os itens que ficarem abaixo do mesmo serão ignorados na geração de seus charts.</p>";
		$messages["sett_limit"][self::EN_US] = "<p class='text-muted'>Here you can select the item limit of your weekly chart. Putting a limit, items that fall below this limit are ignored when generating your data.</p>";

		$messages["sett_lw"][self::PT_BR] = "Posição/reproduções da semana anterior";
		$messages["sett_lw"][self::EN_US] = "Show last week position/plays";

		$messages["sett_move"][self::PT_BR] = "Tipo de 'movimento'";
		$messages["sett_move"][self::EN_US] = "Type of 'move'";

		$messages["sett_none"][self::PT_BR] = "Nenhum (esconder)";
		$messages["sett_none"][self::EN_US] = "None (hide)";

		$messages["sett_plays"][self::PT_BR] = "Mostrar número de reproduções";
		$messages["sett_plays"][self::EN_US] = "Show playcounts";

		$messages["sett_pp"][self::PT_BR] = "Diferença em relação a semana anterior (porcentagem) (apenas para reproduções)";
		$messages["sett_pp"][self::EN_US] = "Difference with last week (percentage) (only for playcounts)";

		$messages["sett_points"][self::PT_BR] = "Mostrar pontos";
		$messages["sett_points"][self::EN_US] = "Show points";

		$messages["sett_showdrop"][self::PT_BR] = "Mostrar itens que saíram do chart no final do mesmo";
		$messages["sett_showdrop"][self::EN_US] = "Show dropouts at the end of the chart";

		$messages["sett_showf_img"][self::PT_BR] = "Mostrar imagens do primeiro colocado acima do chart";
		$messages["sett_showf_img"][self::EN_US] = "Show image of the number one in the top of the chart";

		$messages["sett_showimg"][self::PT_BR] = "Mostrar imagens no chart";
		$messages["sett_showimg"][self::EN_US] = "Show images on the chart";

		$messages["sett_times"][self::PT_BR] = "Mostrar número de semanas no pico";
		$messages["sett_times"][self::EN_US] = "Show number of weeks at peak";

		$messages["sum_exp"][self::PT_BR] = "Soma simples de certificados do artista.<br/> Ex: Artista X tem quatro músicas:<br/> Música 1: 2x platina, Música 2: 5x platina, Música 3: Ouro, Música 4: 1x Diamante + 2x platina; <br/>Total de: ouros: 1, platinas: 9, diamantes: 1, soma: 12.";
		$messages["sum_exp"][self::EN_US] = "Simple sum of the artist certificates";

		$messages["type_new_pass"][self::PT_BR] = "Digite sua nova senha.";
		$messages["type_new_pass"][self::EN_US] = "Type your new password.";

		$messages["tied"][self::PT_BR] = "Você pode alterar as posições dos artistas/álbuns/músicas que tiverem número de reproduções iguais, basta arrastar os itens entre si e apertar em 'editar'.";
		$messages["tied"][self::EN_US] = "You can change the positions of artists / albums / songs that have the same number of reproductions, simply drag items between them";

		$messages["type_user"][self::PT_BR] = "Digite seu nome de usuário";
		$messages["type_user"][self::EN_US] = "Type your username";

		$messages["use_cert"][self::PT_BR] = "Habilitar certificações";
		$messages["use_cert"][self::EN_US] = "Enable certifications";

		$messages["use_cert_cha"][self::PT_BR] = "Mostrar certificações nas listas de álbuns e músicas (geral e dentro da página de artista)";
		$messages["use_cert_cha"][self::EN_US] = "Show certifications in the lists of albums and songs (general and inside the artist page)";
		
		$messages["use_plaque"][self::PT_BR] = "Habilitar placas de certificados";
		$messages["use_plaque"][self::EN_US] = "Enable certifications plaques";

		$messages["unique_exp"][self::PT_BR] = "Cada música/álbum conta apenas uma vez.<br/> Ex: Artista X tem quatro músicas: <br/> Música 1: 2x platina, Música 2: 5x platina, Música 3: Ouro, Música 4: 1x Diamante + 2x platina; <br/> Total de: ouros: 1, platinas: 2, diamantes: 1, soma: 4.";
		$messages["unique_exp"][self::EN_US] = "Each song / album features only once";

		$messages["weighted_exp"][self::PT_BR] = "Cada certificado ganha um peso diferente, o valor da platina sempre será 1, o valor do ouro e do diamante será relativo ao valor da platina.<br/> Ex: Valores: Ouro = 60, Platina = 100, Diamante = 600<br/> Ex: Pesos: Ouro = 0.6, Platina = 1, Diamante = 6<br/> Ex: Artista X tem quatro músicas: <br/> Música 1: 2x platina, Música 2: 5x platina, Música 3: Ouro, Música 4: 1x Diamante + 2x platina; <br/> Total de: ouros: 0.6, platinas: 9, diamantes: 6, soma: 15.6.";
		$messages["weighted_exp"][self::EN_US] = "Each certificate gets a different weight, platinum will always have a value of 1, the value of gold and diamond is relative to platinum value";

		// VALOR CERTIFICADO

		$messages["alb_cert_gold"][self::PT_BR] = "valor do certificado de ouro";
		$messages["alb_cert_gold"][self::EN_US] = "value of gold certificate";

		$messages["alb_cert_platinum"][self::PT_BR] = "valor do certificado de platina";
		$messages["alb_cert_platinum"][self::EN_US] = "value of platinum certificate";

		$messages["alb_cert_diamond"][self::PT_BR] = "valor do certificado de diamante";
		$messages["alb_cert_diamond"][self::EN_US] = "value of diamond certificate";

		$messages["mus_cert_gold"][self::PT_BR] = "valor do certificado de ouro";
		$messages["mus_cert_gold"][self::EN_US] = "value of gold certificate";

		$messages["mus_cert_platinum"][self::PT_BR] = "valor do certificado de platina";
		$messages["mus_cert_platinum"][self::EN_US] = "value of platinum certificate";

		$messages["mus_cert_diamond"][self::PT_BR] = "valor do certificado de diamante";
		$messages["mus_cert_diamond"][self::EN_US] = "value of diamond certificate";

		// CURIOSITIES

		$messages["c_tt_users"][self::PT_BR] = "TOTAL DE USUÁRIOS";
		$messages["c_tt_users"][self::EN_US] = "USERS";

		$messages["c_last_user"][self::PT_BR] = "ÚLTIMO CADASTRO";
		$messages["c_last_user"][self::EN_US] = "LASTEST USER";

		$messages["c_wk_ch"][self::PT_BR] = "CHARTS SEMANAIS";
		$messages["c_wk_ch"][self::EN_US] = "WEEKLY CHARTS";

		$messages["c_us+ch"][self::PT_BR] = "USUÁRIO COM MAIS CHARTS";
		$messages["c_us+ch"][self::EN_US] = "USER WITH MORE CHARTS";

		$messages["c_us_perc"][self::PT_BR] = "Porcentagem de usuários que utilizam pontos/reproduções";
		$messages["c_us_perc"][self::EN_US] = "Percentage of users that use points/plays";

		$messages["c_val_cert"][self::PT_BR] = "Média dos valores colocados para cada certificado";
		$messages["c_val_cert"][self::EN_US] = "Average values for certifications";

		$messages["c_val_cert_b"][self::PT_BR] = "Valor mais utilizado para cada certificado";
		$messages["c_val_cert_b"][self::EN_US] = "Most common values";

		$messages["c_tt_plaques"][self::PT_BR] = "TOTAL DE PLACAS";
		$messages["c_tt_plaques"][self::EN_US] = "PLAQUES";

		$messages["c_plaques_today"][self::PT_BR] = "PLACAS GERADAS HOJE";
		$messages["c_plaques_today"][self::EN_US] = "PLAQUES GENERATED TODAY";

		$messages["c_plaques_day"][self::PT_BR] = "DIA COM MAIS PLACAS GERADAS";
		$messages["c_plaques_day"][self::EN_US] = "DAY WITH MORE PLAQUES";

		$messages["c_us+pl"][self::PT_BR] = "USUÁRIO COM MAIS PLACAS";
		$messages["c_us+pl"][self::EN_US] = "USER WITH MORE PLAQUES";

		$messages["c_last_p"][self::PT_BR] = "ÚLTIMAS PLACAS";
		$messages["c_last_p"][self::EN_US] = "LASTEST PLAQUES";

		// CHANGELOG

		// 0.11.000
		$messages["v_day"][self::PT_BR] = "Agora os charts podem iniciar no Domingo ou na Sexta";
		$messages["v_day"][self::EN_US] = "Now the charts can start on Sunday or on Friday";

		$messages["v_update"][self::PT_BR] = "Agora os charts estarão disponíveis para atualização logo após o encerramento do mesmo, e não apenas 12 horas depois como era até agora";
		$messages["v_update"][self::EN_US] = "Now the charts will be available for update after the closing of the same, not just 12 hours later as it was so far";

		$messages["v_reset"][self::PT_BR] = "Resetar conta: apaga todos os charts";
		$messages["v_reset"][self::EN_US] = "Reset account: delete all charts";

		$messages["v_delete"][self::PT_BR] = "Deletar conta: apaga todos os dados";
		$messages["v_delete"][self::EN_US] = "Delete account: delete all data";

		$messages["v_search"][self::PT_BR] = "Buscar artistas/álbuns/músicas";
		$messages["v_search"][self::EN_US] = "Search artists/albums/musics";

		$messages["v_new_faq"][self::PT_BR] = "Novo FAQ";
		$messages["v_new_faq"][self::EN_US] = "New FAQ";

		$messages["v_new_cur_page"][self::PT_BR] = "Página de curiosidades do ZERO";
		$messages["v_new_cur_page"][self::EN_US] = "ZERO's curiosities page";

		$messages["v_new_cl_page"][self::PT_BR] = "Página de changelog";
		$messages["v_new_cl_page"][self::EN_US] = "Changelog page";

		$messages["v_new_forum"][self::PT_BR] = "Um 'fórum' (q&a) para sugestões, dúvidas, etc.";
		$messages["v_new_forum"][self::EN_US] = "Forum";

		$messages["v_hide_livechart"][self::PT_BR] = "Opção para esconder o 'Live Chart'";
		$messages["v_hide_livechart"][self::EN_US] = "Option to hide the 'Live Chart'";

		$messages["v_plaque_page"][self::PT_BR] = "Página para mostrar todas as placas já geradas";
		$messages["v_plaque_page"][self::EN_US] = "Page to show all the plaques";

		$messages["v_theme"][self::PT_BR] = "Temas: Além do atual, haverá também uma versão 'dark' do site";
		$messages["v_theme"][self::EN_US] = "Themes: There will be also a 'dark' version of the site";

		$messages["v_translate"][self::PT_BR] = "Tradução (para inglês) do FAQ e revisão do que já foi traduzido";
		$messages["v_translate"][self::EN_US] = "FAQ translation";

		// noty

		$messages["no_noty"][self::PT_BR] = "Nenhuma notificação encontrada";
		$messages["no_noty"][self::EN_US] = "No notification found";

		$messages["noty_weeks_to_update"][self::PT_BR] = "Seus charts estão desatualizados";
		$messages["noty_weeks_to_update"][self::EN_US] = "FAQ translation";

		$messages["noty_you_weeks_to_update"][self::PT_BR] = "Você tem {0} semana(s) desatualizada(s).";
		$messages["noty_you_weeks_to_update"][self::EN_US] = "You have {0} semanas(s) out of date.";


		return $messages;
	}

	static function sub($text, $array)
	{
		$array = (array) $array;
		foreach ($array as $key => $value) {
			if(strpos($text, "{".$key."}"))
			{
				$text = str_replace("{".$key."}", $value, $text);
			}
		}

		return $text;
	}

}
?>