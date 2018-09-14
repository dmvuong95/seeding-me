$(function() {
  $('.page-container').click(function() {
    deactiveHamburger();
  });
  //load home content
  $.get('/home', function(data) {
    $('#main-content').html(data);
  });
  // change seed state
  $('#seed').click(function() {
    $.post('/changeSeed', function(data) {
      if (data !== 'error') $('#seed').html(data);
    });
  });
  $("li[name='menu--home']").click(function() {
    $.get('/home', function(data) {
      $('#main-content').html(data);
      deactiveHamburger();
      activeSideItem('home');
    });
  });
  $("li[name='menu--new-post']").click(backToGetLink);
  $("li[name='menu--inc-like']").click(function() {
    $.get('/inc-like', (data)=>{
      if (data.err) alert(data.err);
      else {
        $('#main-content').html(data);
        deactiveHamburger();
        activeSideItem('inc-like');
      }
    });
  });
  $("li[name='menu--comment']").click(function() {

  });
  $("li[name='menu--report']").click(function() {
    $.get('/report', function(data) {
      $('#main-content').html(data);
      deactiveHamburger();
      activeSideItem('report');
    });
  });
  $("li[name='menu--about']").click(function() {
    $.get('/about', function(data) {
      $('#main-content').html(data);
      deactiveHamburger();
      activeSideItem('about');
    });
  });
  $('#account').click(function() {
    $.get('/account',function(data) {
      $('#main-content').html(data);
      $('#account-item').removeClass('show-dropdown');
      $('.active').removeClass('active');
    });
  });
  $('#setting').click(function() {
    $.get('/changePassword', function(data) {
      $('#main-content').html(data);
      $('#account-item').removeClass('show-dropdown');
      $('.active').removeClass('active');
    });
  });

  const socket = io('https://seedingmebot.herokuapp.com',{path:'/webIO'});
  socket.on('online-quantity',(i)=>{
    $('#online-quantity').text(i);
  });
});
function activeSideItem(name) {
  $('.active').removeClass('active');
  $(".side-item[name='menu--"+name+"']").addClass('active');
}
function deactiveHamburger() {
  $('.hamburger').removeClass('is-active');
  $('.navbar-mobile').slideUp('500');
}

function changePassword() {
  var data = getDataFromForm('formChangePassword');
  if (data.password == data.newPassword) {
    alert('Mật khẩu mới giống mật khẩu cũ!');
    return false;
  }
  if (data.newPassword.length < 8) {
    alert('Password phải có ít nhất 8 ký tự!');
    return false;
  }
  if (data.newPassword != data.reNewPassword){
    alert('Mật khẩu mới không giống nhau!')
    return false;
  }
  $.ajax({
    url: '/changePassword',
    data,
    method: 'POST',
    success: function(data) {
      if (data=='success') {
        alert('Đổi mật khẩu thành công!');
        $.get('/changePassword', function(data) {
          $('#main-content').html(data);
        });
        return false;
      } else {alert('Lỗi: '+ data); return false;}
    }
  });
};

function checkLink(data) {
  $.post('/checkLink',data,function(data) {
    if (data.error) {
      $('#addPost').html('<h5>Lỗi link bài đăng:</h5><p id="showError"></p><div class="form-actions form-group"><button class="btn btn-warning btn-sm" onclick="backToGetLink()"><i class="fa fa-caret-left"></i> Trở về</button></div>');
      $('#showError').text(data.error);
    } else if (data.needUserID) {
      $('#addPost').html('<h5>Đối với ảnh này, chúng tôi cần ID người/trang đã đăng nó</h5>'
      +'<form action="javascript:submitFormGetUserID();" id="formGetUserID" style="padding-top:10px;">'
        +'<div class="form-group">'
          +'<div class="input-group">'
            +'<div class="input-group-addon"> ID </div>'
              +'<input type="number" name="user_id" class="form-control" required>'
            +'</div>'
              +'<input type="hidden" name="post_id" value="'+data.post_id+'">'
          +'</div>'
          +'<div class="form-actions form-group">'
            +'<button type="submit" class="btn btn-primary btn-sm"> Tiếp <i class="fa fa-caret-right"></i></button>'
          +'</div>'
          +'</form>'
      +'<p style="padding-top:5px;">Tìm ID tại <a href="https://findmyfbid.com/" target="_blank">findmyfbid.com</a></p>');
    } else {
      $('#addPost').html('<h5>Đây có phải là bài đăng bạn muốn seeding??</h5>'
      +'<iframe id="ifr" src="https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2F'+data.user_id+'%2Fposts%2F'+data.post_id+'&show_text=true&appId=141977443149783&width=500" style="border:none;padding-top:10px;width:500px;height:400px;" scrolling="yes" frameborder="0" allowTransparency="true" allow="encrypted-media"></iframe>'
      +'<p style="padding-top:10px;">Chú ý: Nếu không thể hiển thị bài đăng của bạn ở trên thì có thể bạn chưa công khai nó, đồng nghĩa với việc bạn không thể seeding cho nó.</p>'
      +'<button class="btn btn-warning btn-sm" onclick="backToGetLink()"><i class="fa fa-caret-left"></i> Không đúng</button>'
      +'<button class="btn btn-primary btn-sm" style="padding-left:10px;" onclick="setupNewPost('+data.user_id+','+data.post_id+')"> Đúng <i class="fa fa-caret-right"></i></button>');
    }
  });
}

function submitFormCheckLink() {
  checkLink(getDataFromForm('formCheckLink'));
}
function submitFormGetUserID() {
  let data = getDataFromForm('formGetUserID');
  checkLink({link:'https://www.facebook.com/'+data.user_id+'/posts/'+data.post_id})
}
function setupNewPost(user_id,post_id) {
  $.post('/setupNewPost',{id:user_id+'_'+post_id},function(data) {
    cmtArr = [];
    $('#addPost').html(data);
    $('#readySend').click(function() {
      $('#PostData').toggleClass('disabledDOM');
    });
    if (data.startsWith('<!--existed-->')) {
      alert('Bài đăng đã được seeding trước đó!');
      $.post('/getCmtArr',{id:user_id+'_'+post_id},function(data){
        if(data == 'error') alert('Không thể lấy những comment trước đó');
        else {
          cmtArr = data.cmtArr;
          updateListComment();
        }
      });
    }
  });
}
function backToGetLink() {
  $.get('/newPost', function(data) {
    $('#main-content').html(data);
    activeSideItem('new-post');
    deactiveHamburger();
  });
}
var cmtArr = [];
function addComment() {
  let commentContent = $('#commentContent').val();
  if (commentContent.trim() == '') {
    $('#commentContent').val('');
    return alert('Bạn chưa điền nội dung comment!');
  }
  cmtArr.push({cmt:commentContent.trim(),rep:$('#replyContent').val().trim()});
  updateListComment();
  if (Number($('#numOfCmt').val()) < cmtArr.length)
    $('#numOfCmt').val(cmtArr.length.toString());
}
function deleteComment() {
  let index = [];
  $('#listComment > option:selected').each(function() {
    index.push(Number($(this).val()));
  });
  index.sort(function(a,b){
    return b-a;
  });
  index.forEach((i)=>{
    cmtArr.splice(i,1);
  });
  updateListComment();
  alert('Xoá comment thành công!');
}
function updateListComment() {
  $('#listComment').empty();
  $.each(cmtArr, function (i, item) {
    $('#listComment').append($('<option>', {
        value: i,
        text : shortContent(item.cmt)
    }));
  });
  function shortContent(cmt) {
    cmt = cmt.replace('\n','⏎');
    if (cmt.length <= 60) return cmt;
    return cmt.substring(0,58) + '...';
  }
}
function sendPostData() {
  let data = getDataFromForm('formAddPost');
  //post_id numOfCmt cmtArr numOfReaction reactions age gender
  if (data.ready){
    if (cmtArr.length == 0) return alert('Bạn chưa thêm comment nào cả!');
    if (Number(data.numOfCmt) == 0) return alert('Số comment không thể bằng 0');
    if (Number(data.numOfCmt) < 0) return alert('Số comment không thể nhỏ hơn 0');
    if (Number(data.numOfReaction) < 0) return alert('Số biểu cảm không thể nhỏ hơn 0');
    if ((data.startTime && !data.endTime) || (!data.startTime && data.endTime)) return alert('Bạn chưa chọn đủ việc hẹn thời gian comment');
    data.cmtArr = cmtArr;
    console.log(data);
    $.post('/submitPost',data,function(data1) {
      if (data1.error) return alert(data1.error);
      alert(data1.success);
      $.get('/home', function(data) {
        $('#main-content').html(data);
        activeSideItem('home');
      });
    });
  }
}

function getDataFromForm(idForm) {
  return $('#'+idForm).serializeArray().reduce(function(obj, item) {
    if (obj.hasOwnProperty(item.name)){
      if(typeof obj[item.name] == 'string'){
        obj[item.name] = [obj[item.name],item.value];
      } else {
        obj[item.name].push(item.value);
      }
    }else obj[item.name] = item.value;
    return obj;
  }, {});
}

//Funtion home
function changePostSeedState(post_id) {
  //let a = $("input#checkbox"+post_id).prop("checked");
  $.post('/changePostSeedState',{post_id},(data)=>{
    if (data.err) {
      return alert('Lỗi: '+data.err);
    }
    if (data.seeding) $('#btn'+post_id).html('<button class="btn btn-success btn-sm" onclick="changePostSeedState(\''+post_id+'\')"><i class="fa fa-play"></i> Seeding</button>');
    else $('#btn'+post_id).html('<button class="btn btn-danger btn-sm" onclick="changePostSeedState(\''+post_id+'\')"><i class="fa fa-pause"></i> Off seed</button>');
  });
}
function editPost(post_id) {
  $('#main-content').html('<div class="card"><div class="card-header">Chỉnh sửa bài seeding</div><div class="card-body card-block" id="addPost"></div></div>');
  $.post('/setupNewPost',{id:post_id},function(data) {
    cmtArr = [];
    $('#addPost').html(data);
    $('#readySend').click(function() {
      $('#PostData').toggleClass('disabledDOM');
    });
    $.post('/getCmtArr',{id:post_id},function(data){
      if(data == 'error') alert('Không thể lấy những comment trước đó');
      else {
        cmtArr = data.cmtArr;
        updateListComment();
      }
    });
  });
}
function deletePost(post_id) {
  let c = confirm("Bạn có chắc chắn muốn xoá bài ID: "+ post_id);
  if (c == true) $.post('/deletePost',{post_id},(data)=>{
    if (data.err) return alert("Xoá không thành công!\nLỗi: "+data.err);
    else $('#'+post_id).remove();
  });
}
function addPage() {
  let page_id = $('#page_id').val().trim();
  if (page_id)
    $.post('/inc-like',{page_id,type:'checkPageID'},(data)=>{
      if (data.err) return alert('Lỗi: '+data.err);
      if (data.startsWith('<!--existed-->')) alert('Page đã được chọn để tăng like trước đó!');
      $('#pagesCard').html(data);
    });
}
function sendPageData() {
  var data = getDataFromForm('formAddPage');
  if (Number(data.numOfLike) <= 0) return alert('Số lượng like phải lớn hơn 0');
  data.type = 'setupNewPage';
  $.post('/inc-like',data,(data1)=>{
    if (data1.err) return alert('Lỗi: '+data1.err);
    if (data1.success) {
      alert('Thêm thành công Page!');
      $.get('/inc-like', (data2)=>{
        $('#main-content').html(data2);
      });
    }
  });
}
function changePageSeedState(page_id) {
  $.post('/changePageSeedState',{page_id},(data)=>{
    $('#'+page_id+'td').html(data);
  });
}
function deletePage(page_id,name) {
  let c = confirm('Bạn có chắc chắn muốn xoá Page "'+ name + '"');
  if (c == true) $.post('/delete-inc-like',{page_id},(data)=>{
    if (data.err) return alert("Xoá không thành công!\nLỗi: "+data.err);
    else $('#'+page_id).remove();
  });
}
