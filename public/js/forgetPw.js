function submit() {
  var data = $('form').serializeArray().reduce(function(obj, item) {
    		obj[item.name] = item.value;
    		return obj;
		}, {});
  $.ajax({
    url: '/forgetPassword',
    data,
    method: 'POST',
    success: function(data) {
      if (data=='success') {
        alert('Đã gửi email tới '+$('#email').val());
        location.href = '/';
        return false;
      } else {alert('Lỗi: '+ data); return false;}
    }
  });
};
