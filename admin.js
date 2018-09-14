const graph = require('fbgraph');
graph.setVersion('3.1');
//Config MongoDB
const mongoose = require('mongoose');
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
  coin: Number
});
const postSchema = new mongoose.Schema({
  user_id: String,
  post_id: String,
  createTime: Number,
  cmtArr: Array,
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
const User = mongoose.model('user',userSchema);
const PostDB = mongoose.model('postdb',postSchema);
const UserTask = mongoose.model('user_task',userTaskSchema);

(async function() {
  var users = [];
  try {
    users = await new Promise(function(resolve, reject) {
      User.find({},(err,users)=>{
        if (err) return reject(new Error(err.message));
        return resolve(users);
      });
    });
  } catch (e) {
    return console.log(e+'');
  }
  let validUsers = [];
  let invalidUsers = [];
  for (var i = 0; i < users.length; i++) {
    let user = users[i];
    try {
      let valid = await new Promise(function(resolve, reject) {
        graph.setAccessToken(user.access_token).get('/me',(err,res)=>{
          if (!err) resolve(user.name);
          else reject(new Error(user.name));
        });
      });
      validUsers.push(valid);
    } catch (e) {
      invalidUsers.push(e+'');
    }

    // try {
    //   let task = await new Promise(function(resolve, reject) {
    //     (new UserTask({user_id:user.id,tasks:[]})).save((err,userTask)=>{
    //       if (err) return reject(new Error(err.message));
    //       return resolve('Success create '+userTask.user_id);
    //     });
    //   });
    //   console.log(task);
    // } catch (e) {
    //   console.log(e+'');
    // }
  }
  console.log('Number of Users: '+users.length);
  console.log('Number of valid Users: '+validUsers.length);
  console.log(validUsers);
  console.log('\nNumber of invalid Users: '+invalidUsers.length);
  return console.log(invalidUsers);
})()
