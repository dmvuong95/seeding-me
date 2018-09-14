// const request = require('request');
// request.get({url:'http://id.atpsoftware.com.vn/get.php?link=https://www.facebook.com/885355708318410/photos/a.925674667619847.1073741827.885355708318410/925674577619856/?type=3'},
//   (err,response,data)=>{
//     data = JSON.parse(data);
//     console.log(data);
//     if ([])
//     console.log((new Date()).toISOString());
//     else console.log('1');
//   });
// var a = ['a','b','c'];
// a.splice(a.indexOf('d'),1);
// console.log(a);
//console.log((new Error('404'))+'');

let a = new Date(Date.now()+7*60*60*1000), b = new Date();
console.log(new Date(a.getTime()));
console.log(b);
console.log(a.getDate()+' '+a.getMonth()+' '+a.getYear());
console.log((new Date()).getYear() + 1900 - Number('1995'));

console.log(a);
console.log(a.getHours());
console.log(a.getMinutes());
console.log(('09:55'>'09:50'));

// var i =0,j;
// do {
//   console.log(j);
//   if (i == 0) j=1
//   if (j) j++;
//   i++;
// } while (i < 4);

// (async function() {
//   let a = await new Promise(function(resolve, reject) {
//     setTimeout(function() {
//       return resolve(12331241);
//     }, 1000);
//
//   });
// })();

// const fbgraph = require('fbgraph');
// fbgraph.setAccessToken('EAAAAUaZA8jlABAJTTxmBNFuSXc98kXOF0I6BC0ZCui3ZATt1735gZCcjpQmOSB3js2PkAIuC8Xzu56xQB7TMV5wqrjJlU4SALexEIuJc4FleTZBpIxdnaCCAj9V7M1YixjZCGsQJgOFGTbhh8hmssxn1aiizOH8OFYXi7LdnP6rgZDZD')
// .post('/1956682947738791_1956734761066943/replies',{message:'LIKE'},(err,res)=>{
//   if (err) {
//     console.log('Error');
//     return console.log(err);
//   }
//   console.log(res);
// })
