const express = require('express');
const session = require('express-session');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const graph = require('fbgraph');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const request = require('request');
const secure = require('express-force-https');

// Config express server
const app = express();
app.set('views', './views');
app.set('view engine', 'ejs');
app.use(secure);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({secret: 'mediaz lotus', cookie:{maxAge: 1000*60*60*24}}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));
// Setup graph request
graph.setVersion('3.1');
//Config MongoDB
let mongoUser = {
  name: 'mvuong95',
  pw: 'e6702b'
};
mongoose.connect('mongodb://'+mongoUser.name+':'+mongoUser.pw+'@ds141671.mlab.com:41671/seeding_me', { useNewUrlParser: true });
const userSchema = new mongoose.Schema({
  id: String,
  password: String,
  name: String,
  email: String,
  phone: String,
  birthday: Object,
  gender: String,
  access_token: String,
  joinDate: Number,
  seed: Boolean,
  userType: Number,
  expireDate: Number,
  coin: Number,
  blocked: Boolean
});
const postSchema = new mongoose.Schema({
  user_id: String,
  post_id: String,
  createTime: Number,
  cmtArr: Array,
  startTime: String,
  endTime: String,
  numOfCmt: Number,
  numOfReaction: Number,
  reactions: Array,
  age: Array,
  gender: String,
  seeding: Boolean,
  commented: Array,
  reacted: Array
});
const userTaskSchema = new mongoose.Schema({
  user_id: String,
  tasks: Array
});
const pageIncLike = new mongoose.Schema({
  user_id: String,
  page_id: String,
  name: String,
  category: String,
  numOfLike: Number,
  rate: Boolean,
  liked: Array,
  rated: Array,
  createTime: Number,
  seeding: Boolean
});
const User = mongoose.model('user',userSchema);
const PostDB = mongoose.model('postdb',postSchema);
const UserTask = mongoose.model('user_task',userTaskSchema);
const PageBoost = mongoose.model('page_inc_like',pageIncLike);
//Config Mail service
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'noreply.lotusmediaz@gmail.com',
    pass: 'e6702bTVXQ'
  }
});
async function sendEmailPw(id, pw, email, cb) {
  try {
    var mailOptions = {
      from: 'noreply.lotusmediaz@gmail.com',
      to: email,
      subject: 'Mật khẩu đăng nhập hệ thống Seeding me!',
      html: '<h2>Vui lòng không trả lời thư này. Cảm ơn!</h2><h3>ID: '+id+'</h3><h3>Password: '+pw+'</h3>'
    };
    let result = await new Promise((resolve, reject)=>{
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
          return reject(new Error(error));
        } else {
          console.log('Email sent: ' + info.response);
          return resolve(true);
        }
      });
    });
    cb(null,true);
  } catch (e) {
    cb(e);
  }
}
//
// Route work with extension
//
let origin_header = 'chrome-extension://dgkcbbipepnggaahiphhihbnpkjgbhlj';
let dev_mode_header = 'chrome-extension://pbddcpfpbhcbdhpehccbciefpjkjpjmg';
app.post('/isSignup', function(req,res) {
  if (!(req.get('Origin') == origin_header || req.get('Origin') == dev_mode_header)) return res.sendStatus(404);
  res.set('Access-Control-Allow-Origin', req.get('Origin'));
  User.findOne({id:req.body.id},function(err, user){
    if (err) return res.json({err});
    if (user) {
      return res.json({signed:true});
    } else {
      return res.json({signed:false});
    }
  });
});
app.post('/signup', function(req,res) {
  if (!(req.get('Origin') == origin_header || req.get('Origin') == dev_mode_header)) return res.sendStatus(404);
  res.set('Access-Control-Allow-Origin', req.get('Origin'));
  graph.setAccessToken(req.body.access_token)
  .get('/me?fields=email,mobile_phone,name,birthday,gender',function(err, graphRes) {
    if (err) return res.json({err:err.message});
    if (!graphRes.email) return res.json({err:'Tài khoản Facebook của bạn không đăng ký bất kỳ một email nào để chúng tôi có thể gửi mật khẩu cho bạn. Hãy thêm email cho tài khoản Facebook và đăng ký lại nhé!'});
    let newUser = {
      id: graphRes.id,
      password: makePw(),
      name: graphRes.name,
      email: graphRes.email,
      phone: graphRes.mobile_phone,
      birthday: {
        date: graphRes.birthday.substring(3,5),
        month: graphRes.birthday.substring(0,2),
        year: graphRes.birthday.substring(6)
      },
      gender: graphRes.gender,
      access_token: req.body.access_token,
      joinDate: Date.now(),
      seed: false,
      userType: 3,
      expireDate: Date.now()+30*24*60*60*1000,
      coin: 100
    };
    (new User(newUser)).save(function(err, user) {
      if (err) return res.json({err:err.message});
      (new UserTask({user_id:user.id,tasks:[]})).save((err,userTask)=>{
        if (err) return res.json({err:err.message});
        sendEmailPw(user.id, user.password, user.email, (err,result)=>{
          if (err) return res.json({err:err+''});
          console.log('New UID '+user.id+', named '+user.name+' has just joined');
          return res.json({success:true,email:user.email});
        });
      });
    });
  });
});
app.post('/setAccessToken', function(req,res){
  if (!(req.get('Origin') == origin_header || req.get('Origin') == dev_mode_header)) return res.sendStatus(404);
  res.set('Access-Control-Allow-Origin', req.get('Origin'));
  User.findOne({id:req.body.id}).exec((err,user)=>{
    if (err) return res.json({err});
    if (user) {
      User.update({id:req.body.id},{access_token:req.body.access_token}).exec((err,updateRes)=>{
        if (err) return res.sendStatus(404);
        return res.json({success:true});
      });
    } else return res.sendStatus(404);
  });
});
//
// Route work at browse
//
app.get('/', (req,res)=>{
  if (req.isAuthenticated()) {
    return res.render('index',{user:req.user});
  } else {
    return res.render('login2');
  }
});
app.post('/login', passport.authenticate('local', {failureRedirect: '/', successRedirect: '/'}));
app.route('/forgetPassword')
.get((req,res)=>{
  res.render('forgetPassword')
})
.post((req,res)=>{
  User.findOne({id:req.body.id},(err,user)=>{
    if (err) return res.sendStatus(404);
    if (!user) return res.send('ID không tồn tại!');
    if (!user.email) return res.send('ID '+ user.id + ' không có email trên Facebook. Liên hệ Lotus Mediaz để được nhận password!');
    if (user.email === req.body.email) {
      console.log('UID '+req.body.id+' require send password to email');
      sendEmailPw(req.body.id, user.password, user.email, (err,result)=>{
        if (err) return res.send(err+'');
        return res.send('success');
      });
    } else return res.send('Email nhập không chính xác!');
  });
});
//
//Account
//
app.post('/changeSeed', checkAuthentication, (req,res)=>{
  User.update({id:req.user.id},{seed:!(req.user.seed)}).exec((err, updateRes)=>{
    if (err) return res.send('error');
    if (req.user.seed) return res.send('<button class="btn btn-danger btn-sm"><i class="fa fa-ban"></i> Off seed</button>');
    return res.send('<button class="btn btn-success btn-sm"><i class="fa fa-dot-circle-o"></i> Seeding</button>');
  });
});
app.get('/account', checkAuthentication, (req,res)=>{
  res.render('account',{user:req.user});
});
app.route('/changePassword')
.get((req,res)=>{
  res.render('changePassword');
})
.post(checkAuthentication, (req,res)=>{
  if (req.user.password===req.body.password) {
    User.update({id:req.user.id},{password:req.body.newPassword}).exec((err,updateRes)=>{
      if (err) return res.send(err.message);
      console.log('UID '+req.user.id+' has changed his password at '+(new Date()).toISOString()+' GMT');
      return res.send('success');
    });
  } else return res.send('Bạn nhập không đúng Password hiện tại!');
});
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});
//
// Admin route
app.get('/admin',checkAuthentication, (req,res)=>{
  if (req.user.userType != 4) return res.sendStatus(404);
  User.find({userType:{$lt:4}}).sort({'seed': 1}).exec((err,users)=>{
    if (err) return res.json({err:err.message});
    return res.render('admin',{users});
  });
});
app.post('/block-uid', checkAuthentication, (req,res)=>{
  if (req.user.userType != 4) return res.sendStatus(404);
  User.findOne({id:req.body.id},(err,user)=>{
    if (err) return res.json({err:err.message});
    if (!user) return res.json({err:'User không tồn tại!'});
    User.update({id:req.body.id},{blocked:!user.blocked},(err,updateRes)=>{
      if (err) return res.json({err:err.message});
      return res.json({success:!user.blocked});
    });
  });
});
//
//Side bar
//
app.get('/home', checkAuthentication, (req,res)=>{
  PostDB.find({user_id:req.user.id}).sort({'createTime': -1}).limit(30).exec((err,posts)=>{
    if (err) return res.send('Lỗi kết nối Cơ sở dữ liệu!');
    res.render('home',{posts});
  });
});
app.get('/newPost', (req,res)=>{
  res.render('newPost');
});
app.route('/inc-like')
.get(checkAuthentication, (req,res)=>{
  if (!(req.user.userType >= 3 && req.user.expireDate > Date.now())) return res.json({err:'Bạn phải là thành viên kim cương để sử dụng tính năng này!'});
  PageBoost.find({user_id:req.user.id}).sort({createTime:-1}).limit(30).exec((err,pages)=>{
    if (err) return res.json({err:'Lỗi kết nối Cơ sở dữ liệu!'});
    return res.render('incLikeHome',{pages});
  });
})
.post(checkAuthentication, (req,res)=>{
  if (!(req.user.userType >= 3 && req.user.expireDate > Date.now())) return res.json({err:'Bạn phải là thành viên kim cương để sử dụng tính năng này!'});
  if (req.body.type === 'checkPageID') {
    graph.setAccessToken(req.user.access_token).get('/'+req.body.page_id+'?fields=category,id,name',(err,graphRes)=>{
      if (err) return res.json({err:err.message});
      PageBoost.findOne({user_id:req.user.id,page_id:graphRes.id},(err,page)=>{
        if (err) return res.json({err:err.message});
        if (page) return res.render('setupNewPage',{page});
        else return res.render('setupNewPage',{page:{page_id:graphRes.id,name:graphRes.name,category:graphRes.category}});
      });
    });
  } else if (req.body.type === 'setupNewPage') {
    if (!req.user.seed) return res.json({err:'Tài khoản của bạn chưa bật seeding!'});
    var data = req.body;
    data.seeding = true;
    PageBoost.findOne({user_id:req.user.id,page_id:data.page_id},(err,page)=>{
      if (err) return res.json({err:err.message});
      if (page) {
        if (page.liked.length < Number(data.numOfLike)) {
          if (!data.rate) data.rate = false;
          PageBoost.update({user_id:req.user.id,page_id:data.page_id},data,(err,updateRes)=>{
            if (err) return res.json({err:err.message});
            return res.json({success:true});
          });
        } else return res.json({err:'Số lượng like phải lớn hơn số lượng đã like!'});
      } else {
        data.user_id = req.user.id;
        data.createTime = Date.now();
        (new PageBoost(data)).save((err,page)=>{
          if (err) return res.json({err:err.message});
          return res.json({success:true});
        });
      }
    });
  }
});
app.get('/report', checkAuthentication, (req,res)=>{
  res.send("Developing!");
});
app.get('/about', checkAuthentication, (req,res)=>{
  res.send("Developing!");
});
//Check link
app.post('/checkLink', checkAuthentication, (req,res)=>{
  var link = req.body.link;
  if (!link) return res.sendStatus(404);
  const domains = ['https://www.facebook.com/','www.facebook.com/','https://facebook.com/','facebook.com/','https://m.facebook.com/','m.facebook.com/'];
  var accept = false;
  for (const domain of domains) {
    if (link.startsWith(domain)) {
      accept = true;
      link = link.substring(domain.length);
      if (link.startsWith('permalink.php?story_fbid=')) {
        link = link.substring(25);
        let arr = link.split('&id=');
        let a = getNumber(arr[1]);
        graph.setAccessToken(req.user.access_token)
        .get('/'+a+'_'+arr[0],(err,graphRes)=>{
          if (err) return res.json({error:err.message});
          return res.json({user_id:a,post_id:arr[0]});
        });
      } else if (link.startsWith('photo.php?fbid=')) {
        link = link.substring(15);
        let arr = link.split('&');
        let post_id = arr[0];
        if (arr[1].startsWith('set=pcb.') || arr[1].startsWith('set=a.')){
          return res.json({needUserID:true,post_id});
        // } else if (arr[1].startsWith('set=a.')) {
          // let user_id = arr[1].substring(6);
          // user_id = arr[1].split('.');
          // user_id = user_id[1];
          // graph.setAccessToken(req.user.access_token);
          // graph.get('/'+user_id+'_'+post_id,(err,graphRes)=>{
          //   if (err) return res.json({error:err.message});
          //   return res.json({user_id,post_id});
          // });
        }else if(arr[1].startsWith('set=pob.')){
          getFullID(post_id,getNumber(arr[1].substring(8)),req.user.access_token,(err,data)=>{
            if (err) return res.json({error:err});
            return res.json(data);
          });
        } else {
          return res.json({error:'Link không chính xác!'});
        }
      } else if (link.startsWith('events/')){
        link = link.substring(7);
        let arr = link.split('/');
        getFullID(arr[2],arr[0],req.user.access_token,(err,data)=>{
          if (err) return res.json({error:err});
          return res.json(data);
        });
      } else {
        let arr = link.split('/');
        if (arr[1] == 'photos') {
          getFullID(arr[3],arr[0],req.user.access_token,(err,data)=>{
            if (err) return res.json({error:err});
            return res.json(data);
          });
        } else if (arr[1] == 'posts') {
          getFullID(getNumber(arr[2]),arr[0],req.user.access_token,(err,data)=>{
            if (err) return res.json({error:err});
            return res.json(data);
          });
        } else if (arr[1] == 'videos') {
          if (arr[2].startsWith('pcb.')) {
            getFullID(arr[3],arr[0],req.user.access_token,(err,data)=>{
              if (err) return res.json({error:err});
              return res.json(data);
            });
          } else {
            getFullID(getNumber(arr[2]),arr[0],req.user.access_token,(err,data)=>{
              if (err) return res.json({error:err});
              return res.json(data);
            });
          }
        } else {
          return res.json({error:'Link không chính xác!'});
        }
      }
    }
  }
  if (!accept) return res.json({error:'Link không chính xác!'});

  function getNumber(str) {
    var a ='',i=0;
    do {
      a = a + str[i];
      i++;
    } while (!isNaN(str[i]) && i < str.length);
    return a;
  }
  async function getFullID(link,user,access_token,cb) {
    try {
      var user_id = '';
      var post_id = '';
      if (isNaN(link)){
        post_id = await getPostID(link);
      } else {
        post_id = link;
      }
      if (isNaN(user)){
        user_id = await checkID(user,access_token);
      } else {
        user_id = user;
      }
      let id = await checkID(user_id+'_'+post_id,access_token);
      cb(null,{user_id,post_id});
    } catch (e) {
      cb(e+'');
    }
  }
  function getPostID(link) {
    return new Promise(function(resolve, reject) {
      request.get({
        url: 'http://id.atpsoftware.com.vn/get.php?link=' + link
      },(err,response,data)=>{
        if (err) return reject(new Error('Lỗi Server!'));
        data = JSON.parse(data);
        if (data.hasOwnProperty('error')) return reject(new Error('Không thể lấy id phía ATP'));
        return resolve(data.id);
      });
    });
  }
});
app.post('/setupNewPost', checkAuthentication, (req,res)=>{
  let post_id = req.body.id;
  if (!post_id) return res.sendStatus(404);
  PostDB.findOne({user_id:req.user.id,post_id}).exec((err,post)=>{
    if (err) return res.send('error');
    if (post) {
      return res.render('setupNewPost',{post,user:req.user});
    } else {
      return res.render('setupNewPost',{post:{post_id},user:req.user});
    }
  });
});
app.post('/getCmtArr', checkAuthentication, (req,res)=>{
  let post_id = req.body.id;
  if (!post_id) return res.sendStatus(404);
  PostDB.findOne({user_id:req.user.id,post_id}).exec((err,post)=>{
    if (err) return res.send('error');
    if (post) {
      return res.json(post);
    } else return res.sendStatus(404);
  });
});
app.post('/submitPost', checkAuthentication, (req,res)=>{
  //post_id numOfCmt cmtArr numOfReaction reactions age gender
  let data = req.body;
  (async function(data, user, cb) {
    try {
      let post_id = await checkID(data.post_id,user.access_token);
      let done = await new Promise(function(resolve, reject) {
        PostDB.findOne({user_id:user.id,post_id}).exec((err,post)=>{
          if (err) return reject(new Error(err.message));
          if (post) {
            if (!(data.post_id && data.numOfCmt && data.cmtArr && data.numOfReaction && data.ready == 'OK')
              || Number(data.numOfCmt)<=0 || Number(data.numOfReaction)<0 || isNaN(data.numOfCmt) || isNaN(data.numOfReaction))
              return reject(new Error('404'));
            // Tat ca mn phai bat seeding
            if (!(user.seed)) return reject(new Error('Bạn chưa bật seeding tài khoản cá nhân!'));
            //Thanh vien vang moi co chuc nang hen gio tuong tac
            if (!(user.userType >= 2 && user.expireDate >= Date.now()) && (data.startTime || data.endTime)) return reject(new Error('Bạn phải ít nhất là thành viên vàng để sử dụng tính năng hẹn giờ tương tác!'));

            if (user.expireDate < Date.now()){
              if (data.gender || data.reactions || data.age) return reject(new Error('Bạn là tài thành viên thường nên không thể chọn biểu cảm, độ tuổi và giới tính!'));
              //if (!(user.seed)) return reject(new Error('Bạn chưa bật seeding đối với thành viên thường!'));
            }
            let sum = 3*(Number(data.numOfCmt)-post.commented.length)+Number(data.numOfReaction)-post.reacted.length;
            if (sum>user.coin)
              return reject(new Error('Tổng số coin để bình luận và biểu cảm không thể vượt quá số coin hiện tại.\nCoin hiện tại: '+user.coin+'\nCoin cần thiết: '+sum));

            if(Number(data.numOfCmt)-post.commented.length>0 || Number(data.numOfReaction)-post.reacted.length>0) data.seeding = true;
            else data.seeding = false;

            data.createTime = Date.now();
            PostDB.update({user_id:user.id,post_id},data).exec((err,updateRes)=>{
              if (err) return reject(new Error(err.message));
              return resolve({success:'Cập nhật bài seeding thành công!'});
            });
          } else {
            if (!(data.post_id && data.numOfCmt && data.cmtArr && data.numOfReaction && data.ready == 'OK')
              || Number(data.numOfCmt)<=0 || Number(data.numOfReaction)<0 || isNaN(data.numOfCmt) || isNaN(data.numOfReaction))
              return reject(new Error('404'));
            // Tat ca mn phai bat seeding
            if (!(user.seed)) return reject(new Error('Bạn chưa bật seeding tài khoản cá nhân!'));
            //Thanh vien vang moi co chuc nang hen gio tuong tac
            if (!(user.userType >= 2 && user.expireDate >= Date.now()) && (data.startTime || data.endTime)) return reject(new Error('Bạn phải ít nhất là thành viên vàng để sử dụng tính năng hẹn giờ tương tác!'));

            if (user.expireDate < Date.now()){
              if (data.gender || data.reactions || data.age) return reject(new Error('Bạn là tài thành viên thường nên không thể chọn biểu cảm, độ tuổi và giới tính!'));
              //if (!(user.seed)) return reject(new Error('Bạn chưa bật seeding đối với thành viên thường!'));
            }
            let sum = 3*Number(data.numOfCmt)+Number(data.numOfReaction);
            if (sum>user.coin)
              return reject(new Error('Tổng số bình luận và biểu cảm không thể vượt quá số coin.\nCoin: '+user.coin+'\nTổng: '+sum));

            data.user_id = user.id;
            data.createTime = Date.now();
            data.commented = [];
            data.reacted = [];
            data.seeding = true;
            (new PostDB(data)).save((err,post)=>{
              if (err) return reject(new Error(err.message));
              return resolve({success:'Thêm bài seeding thành công!'});
            });
          }
        });
      });
      cb(null,done);
    } catch (e) {
      cb(e);
    }
  })(data,req.user,(err,done)=>{
    if (err){
      if(err+'' == 'Error: 404') return res.sendStatus(404);
      return res.json({error:err+''});
    }
    return res.json(done);
  });

});
app.post('/changePostSeedState', checkAuthentication, (req,res)=>{
  PostDB.findOne({user_id:req.user.id,post_id:req.body.post_id}).exec((err,post)=>{
    if (err) return res.json({err:err+''});
    if (post) {
      PostDB.update({user_id:req.user.id,post_id:req.body.post_id},{seeding:!(post.seeding)}).exec((err,updateRes)=>{
        if (err) return res.json({err:err+''});
        return res.json({seeding:!(post.seeding)});
      });
    } else return res.json({err:"Post doesn't exist"});
  });
});
app.post('/deletePost', checkAuthentication, (req,res)=>{
  PostDB.deleteOne({user_id:req.user.id,post_id:req.body.post_id},function(err){
    if (err) return res.json({err:err+''});
    return res.json({success:true});
  });
});
app.post('/changePageSeedState', checkAuthentication, (req,res)=>{
  PageBoost.findOne({user_id:req.user.id,page_id:req.body.page_id},(err,page)=>{
    if (!err && page){
      if (page.liked.length >= page.numOfLike) return res.send('<span style="color:#428cfa;">Thành công</span>');
      let seeding = page.seeding;
      PageBoost.update({user_id:req.user.id,page_id:req.body.page_id},{seeding:!seeding},(err,updateRes)=>{
        if (!err) {
          let isRate = '';
          if (page.rate) isRate = ' và rate';
          if (seeding) return res.send('<span class="status--denied" style="cursor:pointer;" onclick="changePageSeedState(\''+ page.page_id +'\');">Đã tắt like'+isRate+'</span>');
          else return res.send('<span class="status--process" style="cursor:pointer;" onclick="changePageSeedState(\''+ page.page_id +'\');">Đang tăng like'+isRate+'</span>');
        }
      });
    }
  });
});
app.post('/delete-inc-like', checkAuthentication, (req,res)=>{
  PageBoost.deleteOne({user_id:req.user.id,page_id:req.body.page_id},(err)=>{
    if (err) return res.json({err:err+''});
    return res.json({success:true});
  });
});
//
//Config passport
//
passport.use(new localStrategy(
  {
    usernameField: 'id',
    passwordField: 'password'
  },
  function(username, password, done) {
    User.findOne({id:username},(err,user)=>{
      if (err) return done(err);
      if (user) {
        if (user.password == password && !user.blocked) return done(null, user);
        else return done(null, false);
      } else return done(null, false);
    });
  }
));
passport.serializeUser((user, done) => done(null, user)); //Push user to req.session.passport.user
passport.deserializeUser((userSession, done) => {
  //Find user in this session exist in database
  User.findOne({id: userSession.id}).exec((err, user) => {
    if (err) return done(err);
    if (user) return done(null, user);
    else return done(err);
  })
});

//Launch server
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  app.listen(process.env.PORT||3000, ()=> console.log('Server is running on port '+ (process.env.PORT||3000)));
});

//Check Right PostID
function checkID(id, access_token) {
  return new Promise(function(resolve, reject) {
    graph.setAccessToken(access_token)
    .get('/'+id,(err,graphRes)=>{
      if (err) return reject(new Error(err.message));
      return resolve(graphRes.id);
    });
  });
}
//Check Login
function checkAuthentication(req, res , next){
  if(req.isAuthenticated()){
      next();
  } else{
      res.redirect("/");
  }
}
//Random password
function makePw() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 20; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}
