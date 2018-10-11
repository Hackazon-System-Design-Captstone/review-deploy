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
let clusters = ['http://ec2-204-236-202-7.compute-1.amazonaws.com:7764', 'http://ec2-34-202-161-112.compute-1.amazonaws.com:7765', 'http://ec2-52-23-220-90.compute-1.amazonaws.com:7766']
let index = 0;

    // return reviews with posted productId
app.get(`/reviews/*`, bodyParser.json(), (req, res) => {
  index++;
  index = index % 3;
  let productId = req.originalUrl.split('/')[2]; 
  if (!!!productId) {productId = 1}
  client.getAsync('key '+ productId).then( (data) => {
    if (data !== null) {
      res.status(200).send(JSON.parse(data))
    } else {
    axios.get(clusters[index] + `/reviews/${productId}`)
    .then(({data})=>{
      client.setAsync('key ' + productId,  JSON.stringify(data) );
      res.send(data);
    })
    .catch(({err})=>{res.status(500).send(err)});
    }
  });
});

    // increment helpfullness
app.get(`/helpful/*`, bodyParser.json(), (req, res) => {
  index++;
  index = index % 3;
  let productId = req.originalUrl.split('/')[2];
  let reviewId = req.originalUrl.split('/')[3];
  axios.get(clusters[index] + `/helpful/${productId}/${reviewId}`)
  .then(({data}) => {res.send(data)})
  .catch(({err}) => {res.status(300).send(err)});
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
