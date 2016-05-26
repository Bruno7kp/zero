$(document).ready(function(){
	initialize();
});

function initialize()
{
	formSubmit();
}

function formSubmit()
{
	submitBtn = $(".send");
	submitBtn.on('click', function(event) {
		event.preventDefault();
		thisBtn = $(this);
		disable(thisBtn);
		form = $(this).closest('form').serializeArray();
		url = $(this).closest('form').attr('action');
		method = $(this).closest('form').attr('method');
		$.ajax({
			url: url,
			type: method,
			data: form,
		})
		.done(function(data) {
			data = JSON.parse(data);
			if(data.erro == 0)
			{
 				window[data.call](data);
			}
			else
			{
				showAlert(data.erro, data.message);
				undisable(thisBtn);
			}
		})
		.fail(function() {
			console.log("error");
			showAlert(1, "Something went wrong. Try Again later.");
			undisable(thisBtn);
		})
		.always(function() {
			console.log("complete");
		});
	});
}

function disable(item)
{
	item.attr('disabled', 'disabled');
	item.addClass('disabled');
	item.text('wait...');
}

function undisable(item)
{
	item.removeAttr('disabled');
	item.removeClass('disabled');
	item.text('submit');
}

function goTo(data)
{
	window.location.href = data.url;
}

function showAlert(erro, message)
{
	type = "danger";
	title = "Oops";
	icon = "icon-sad-face fa-4x";
	if(erro == 0)
	{
		type = "success";
		title = "Success";
		icon = "ti-thumb-up";
	}

	$.notify({
		icon: icon,
		title: title,
		message: message,
		animate: {
			enter: 'animated fadeInUp',
			exit: 'animated fadeOutDown'
		}
	},{
		type: 'minimalist',
		delay: 4000,
		allow_dismiss: true,
		newest_on_top: true,
		template: '<div data-notify="container" class="col-xs-11 col-sm-3 alert alert-{0}" role="alert">' +
			'<button type="button" aria-hidden="true" class="close" data-notify="dismiss">×</button>' +
			'<i data-notify="icon" class="bottomspace-sm pull-left"></i>' +
			'<span data-notify="title">{1}</span>' +
			'<span data-notify="message">{2}</span>' +
		'</div>',
		placement: {
			from: "top",
			align: "center"
		}
	});
}