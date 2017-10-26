var express = require('express');
var router = express.Router();
var config = require("../config/config");
var request = require("request");


const apiBaseUrl = 'http://api.themoviedb.org/3';
const nowPlayingUrl = apiBaseUrl + '/movie/now_playing?api_key='+config.apiKey
const imageBaseUrl = 'http://image.tmdb.org/t/p/w300';



/* GET home page. */
router.get('/', function(req, res, next) {
	request.get(nowPlayingUrl, (error, response, movieData)=>{
		if(error){
			console.log(error);
		}else{
			var parsedData = JSON.parse(movieData);
			res.render("test", {
				parsedData: parsedData.results,
				imageBaseUrl: imageBaseUrl
			});
		}
	});
    // res.render('index', { title: 'Express' });
});

module.exports = router;