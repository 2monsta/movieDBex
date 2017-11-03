var express = require('express');
var router = express.Router();
var config = require("../config/config");
var request = require("request");
var mysql = require("mysql");


const apiBaseUrl = 'http://api.themoviedb.org/3';
const nowPlayingUrl = apiBaseUrl + '/movie/now_playing?api_key='+config.apiKey
const imageBaseUrl = 'http://image.tmdb.org/t/p/w300';

var connection = mysql.createConnection(/* {
	host: config.db.host,
	user: config.db.user,
	password:config.db.password,
	database: config.db.database
} */
config.db);
connection.connect((error)=>{
	console.log(error);
});

/* GET home page. */
// router.get('/', function(req, res, next) {
// 	request.get(nowPlayingUrl, (error, response, movieData)=>{
// 		if(error){
// 			console.log(error);
// 		}else{
// 			var parsedData = JSON.parse(movieData);
// 			res.render("test", {
// 				parsedData: parsedData.results,
// 				imageBaseUrl: imageBaseUrl
// 			});
// 		}
// 	});
//     // res.render('index', { title: 'Express' });
// });
// // if you have /: that part of the path is WILD
// in this case /movie/:movieID will trigger on  /movie/ANYTHING
// to access the anything, you go to req.params.ANYTHING
// router.get("/movie/:movieID", (req, res)=>{
// 	// somewhere in the movieAPI backend, they made some JSON then JSON.stringify
// 	var movieID = req.params.movieID;
// 	var thisMovieURL = `${apiBasedUrl}/movie/${movieID}?api_key=${config.apiKey}`
// 	request.get(thisMovieURL, (error, response, movieData)=>{
// 		var parsedData = JSON.parse(movieData);
// 		// res.json(parsedData);
// 		res.render("single-movie", {movieData: parsedData, imageBaseUrl: imageBaseUrl})
// 	})
// })
// router.post("/search", (req,res)=>{
// 	// res.send("search route here");
// 	// anything in a form that has a name send through post is available inside the req.body object
// 	// res.json(req.body); //will return the data back in json format
	

// })


router.get("/", (req, res, next)=>{
	var message = req.query.msg;
	res.render("index", {message:message});
})
// anything in a form that has name send through a get request, is available inside the req.query

router.post("/registerProcess", (req, res, next)=>{
	var name = req.body.name;
	var email = req.body.email;
	var password = req.body.password;
	// checked to see if this person has been registerd
	// we need a select statement
	// if the email already exists, stop and send them an error
	// if the email doesn't exist, insert into the data base

	var selectQuery = "select * from users where email=?;";
	connection.query(selectQuery, [email], (error, results, field)=>{
		if(results.length == 0){ // this user is not in the database
			var insertQuery = "insert into users (name, email, password) values (?, ?, ?);"
			connection.query(insertQuery, [name, email, password], (error, results, field)=>{
				if(error){
					console.log(error);
				}else{
					console.log("Success");
					res.redirect("/?msg=registered");
				}
			});
		}else{
			res.redirect("/?msg=fail");
		}
	});

})
module.exports = router;