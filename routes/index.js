var express = require('express');
var router = express.Router();
var config = require("../config/config");
var request = require("request");
var mysql = require("mysql");
var bcrypt = require("bcrypt-nodejs");

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
	if(error){
		console.log(error);
	}
});

function searchUserName(email, pageToLoad){
	//getting the username from the database where it matched the email used to log in
	var searchquery = "select name from users where email = ?"
	connection.query(searchquery, [email], (error, results, field)=>{
		res.redirect(`/${pageToLoad}?msg=loggedIn&userName=${results[0].name}`);
	});
}

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
// anything in a form that has name send through a get request, is available inside the req.query

//=========================INDEX============================
router.get("/", (req, res, next)=>{
	res.render("index");
});
//========================= NOW PLAYING =====================
router.get("/nowPlaying", (req, res, next)=>{
	var message = req.query.msg;
	var userName = req.query.userName;
	var email = req.query.email;
	console.log(userName);
	console.log(email);
	request.get(nowPlayingUrl, (error, response, movieData)=>{
		if(error){
			console.log(error);
		}else{

			var parsedData = JSON.parse(movieData);
			res.render("nowplaying", {
				parsedData: parsedData.results,
				imageBaseUrl: imageBaseUrl,
				message:message,
				username: userName,
				userEmail: email
			});
			// res.json(parsedData);
		}
	});
});

// =========================SINGLE MOVIE PAGE=====================
router.get("/singlemovie/:id", (req, res, next)=>{
	var movieID = req.params.id;
	var thisMovieUrl = `${apiBaseUrl}/movie/${movieID}?api_key=${config.apiKey}`;
	request(thisMovieUrl, (error, response, data)=>{
		// console.log(data);
		var parsedData = JSON.parse(data);
		res.render("singlepage", {
			production:parsedData.production_companies,
		 	genres: parsedData.genres
		});
		// res.json(parsedData);
	})	
});


//===============REGISTRATION PAGE=====================
router.get("/registerProcess", (req, res, next)=>{
	var message = req.query.msg;
	res.render("register", {message:message});
});

router.post("/registerProcess", (req, res, next)=>{
	var name = req.body.name;
	var email = req.body.email;

	var password = req.body.password;
	// convert the english password to a bcrypt has

	var hash = bcrypt.hashSync(password);
	// checked to see if this person has been registerd
	// we need a select statement
	// if the email already exists, stop and send them an error
	// if the email doesn't exist, insert into the data base

	var selectQuery = "select * from users where email=?;";
	connection.query(selectQuery, [email], (error, results, field)=>{
		if(results.length == 0){ // this user is not in the database
			var insertQuery = "insert into users (name, email, password) values (?, ?, ?);"
			connection.query(insertQuery, [name, email, hash], (error, results, field)=>{
				if(error){
					console.log(error);
				}else{
					console.log("Success");
					res.redirect(`/nowPlaying?msg=registered&userName=${name}`);
				}
			});
		}else{
			res.redirect("/registerProcess?msg=fail");
		}
	});

})

//===============LOGIN PAGE=====================
router.get("/login", (req, res,next)=>{
	res.render("login")
});

router.post("/loginProcess", (req,res,next)=>{
	var email = req.body.email;
	var password = req.body.password;
	var selectQuery = "select * from users where email = ?;";
	connection.query(selectQuery, [email, password], (error, results, field)=>{
		if(results.length == 0){
			// these are what we are looking for
			res.redirect("/?msg=failed");//need to edit index page to correspond with failed message
		}else{
			// this email is in the databaes
			// check to see if the password matches
			// compareSync takes two args, one the english password, second the hash password in the db that we want to check against
			var doTheyMatch = bcrypt.compareSync(password, results[0].password);
			// returns a bool
			if(doTheyMatch){
				// this is what we are looking for
				// we checked the english pass through bcrypt against the db has and they matched
				var searchquery = "select name from users where email = ?"
				connection.query(searchquery, [email], (error, results, field)=>{
					res.redirect(`/nowplaying?msg=loggedIn&userName=${results[0].name}&email=${email}`);
				});
			}else{
				res.redirect("/registerProcess?msg=badpass");
			}
		}
	})
});


//============================ADD TO FAVROTIE =====================
router.get("/fav", (req, res, next)=>{
	// res.send("you clicked fav")
	// searchUserName(); need to pass the email around once the user log in

	// var movieID = req.query.id;
	// var thisMovieUrl = `${apiBaseUrl}/movie/${movieID}?api_key=${config.apiKey}`;
	// request(thisMovieUrl, (error, response, data)=>{
	// 	// console.log(data);
	// 	var parsedData = JSON.parse(data);
	// 	var movieObject = {
	// 		thisUrl: parsedData.poster_path,
	// 		title: parsedData.title,
	// 		imageBaseUrl:imageBaseUrl
	// 	}
	// 	movieDetail.push(movieObject);
	// 	res.render("fav", {
	// 		movieDetail:movieDetail
	// 	});
		// res.json(parsedData);
	// })	
	var email = req.query.email;
	console.log(email);
	// check to see if the user is logged in
		//search through the database and search for their favorites
	var selectQ = "select f.title, f.imageUrl, f.userID from favorite as f join users as u on f.userID = u.id where u.email=? ;";

	connection.query(selectQ, [email], (error, results, field)=>{
		
		// if it's empty, insert it into the database
		


		console.log(selectQ);
		res.render("fav", {
			baseImageUrl:imageBaseUrl,
			result: results
		});
	});


	// if it's empty, insert it into the database

});

module.exports = router;