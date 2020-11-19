window.onload = function () {
	var clipboard = new ClipboardJS('.copy-link');

	clipboard.on('success', function (e) {
		$('.toast').toast('show')
		console.log(e);
	});

	clipboard.on('error', function (e) {
		console.log(e);
	});
}

function toggleChecked(trigger, toShow, toHide) {
	var checkBox = document.getElementById(trigger);
	var show = document.getElementById(toShow);
	var hide = document.getElementById(toHide);

	if (checkBox.checked == true) {
		show.style.display = "block";
		hide.style.display = "none";
	} else {
		show.style.display = "none";
		hide.style.display = "block";
	}
}