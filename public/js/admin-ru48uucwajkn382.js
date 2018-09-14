$(function() {
  $('#admin').click(function() {
    $.get('/admin',(data)=>{
      if (data.err) return alert('Lỗi: '+data.err);
      $('#main-row').html(data);
      $('button.block').click(function() {
        let id = $(this).attr('uid');
        $.post('/block-uid',{id},(data)=>{
          if (data.err) return alert('Lỗi: '+data.err);
          if (data.success === true) $('#i'+id).css('color','red');
          if (data.success === false) $('#i'+id).css('color','');
        });
      });
      $('#account-item').removeClass('show-dropdown');
      $('.active').removeClass('active');
    });
  });
});
