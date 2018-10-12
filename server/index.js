require('newrelic');
const compression = require('compression');
const redis = require("redis");
const bluebird = require('bluebird');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
bluebird.promisifyAll(redis);
let port = 7763;
let app = express();

app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.listen(port);
app.use(express.static('public'));
app.options(`/reviews/*`, bodyParser.json(), (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.status(202).send();
});
let client = redis.createClient();
client.on('error',function(err){ console.error(err)})
let clusters = ['http://ip-172-31-8-83.us-west-1.compute.internal:7766', 'http://ip-172-31-10-90.us-west-1.compute.internal:7766', 'http://ip-172-31-5-135.us-west-1.compute.internal:7766', 'http://ip-172-31-27-34.us-west-1.compute.internal:7766', 'http://ip-172-31-14-42.us-west-1.compute.internal:7766']
// let clusters = ['http://ec2-13-57-204-123.us-west-1.compute.amazonaws.com:7766', 'http://ec2-54-215-248-218.us-west-1.compute.amazonaws.com:7766', 'http://ec2-54-215-248-223.us-west-1.compute.amazonaws.com:7766', 'http://ec2-18-144-18-49.us-west-1.compute.amazonaws.com:7766', 'http://ec2-54-153-57-18.us-west-1.compute.amazonaws.com:7766']

let index = 0;

    // return reviews with posted productId
app.get(`/reviews/*`, bodyParser.json(), (req, res) => {
  let productId = req.originalUrl.split('/')[2]; 
  if (!!!productId) {productId = 1}
  client.getAsync('key '+ productId).then( (data) => {
    if (data !== null) {
      res.status(210).send(JSON.parse(data))
    } else {
    index++;
    index = index % 5;
    axios.get(clusters[index] + `/reviews/${productId}`)
    .then(({data})=>{
      res.send(data);
      client.setAsync('key ' + productId,  JSON.stringify(data) );
    })
    .catch(({err})=>{res.status(500).send(err)});
    }
  });
});

    // increment helpfullness
app.get(`/helpful/*`, bodyParser.json(), (req, res) => {
  index++;
  index = index % 5;
  let productId = req.originalUrl.split('/')[2];
  let reviewId = req.originalUrl.split('/')[3];
  axios.get(clusters[index] + `/helpful/${productId}/${reviewId}`)
  .then(({data}) => {res.send(data)})
  .catch(({err}) => {res.status(300).send(err)});
});

app.get('/loaderio-bad0217256432a2cc5cd44ca437db311', (req, res) => {
  res.send('loaderio-bad0217256432a2cc5cd44ca437db311');
});
    // create a new review
// app.post(`/reviews/new`, bodyParser.json(), (req, res) => {
//   let data = req.body;
//   db.createReview(data, (err, data) => {
//     if (err) return console.error(err);
//     res.status(202).send();
//   });
// });

// app.put(`/reviews/update/:id`, bodyParser.json(), (req, res) => {
//   let reviewId = req.params.reviewID;
//   let data = req.body;
//   // console.log(data);
//   db.updateReview(data, reviewId, (err, data) => {
//     if (err) {
//       return console.error(err);
//     }
//     res.status(202).send(data);
//   });
// });
  
// app.delete(`/reviews/delete/:id`, bodyParser.json(), (req, res) => {
//   let reviewId = req.params.reviewID;
//   db.deleteReview(reviewId, (err, data) => {
//     if (err) {
//       return console.error(err);
//     }
//     res.status(202).send(data);
//   });
// });
