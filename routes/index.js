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
var login = false;
function searchUserName(email, pageToLoad){
	//getting the username from the database where it matched the email used to log in
	var searchquery = "select name from users where email = ?"
	connection.query(searchquery, [email], (error, results, field)=>{
		res.redirect(`/${pageToLoad}?msg=loggedIn&userName=${results[0].name}`);
	});
}

/* GET home page. */
// // if you have /: that part of the path is WILD
// in this case /movie/:movieID will trigger on  /movie/ANYTHING
// to access the anything, you go to req.params.ANYTHING

// 	// res.send("search route here");
// 	// anything in a form that has a name send through post is available inside the req.body object
// 	// res.json(req.body); //will return the data back in json format
	
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
					// res.redirect(`/nowPlaying?msg=registered&userName=${name}`);
					res.redirect("/login");
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
					login = true;
					res.redirect(`/nowplaying?msg=loggedIn&userName=${results[0].name}&email=${email}`);
				});
			}else{
				res.redirect("/registerProcess?msg=badpass");
			}
		}
	})
});


//============================ADD TO FAVROTIE =====================
// adds to database and then display
router.get("/fav", (req, res, next)=>{
	//============Without DB================
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
	if(login){
		//============With DB================
		console.log(login);
		var email = req.query.email;
		var postPath = req.query.postpath;
		var movieTitle = req.query.movieTitle;

		function checkEmailInDB(email){
			return new Promise((resolve, reject)=>{
				var getID = "select id from users where email = ?;";
					connection.query(getID, [email], (error, results, field)=>{
						var userID = results[0].id;
						resolve(userID);
					});
			})
		}
		function checkWhatsInDB(movieTitle, userID, email){
			return new Promise ((resolve, reject)=>{
				var checkQuery = "select title from favorite where title = ? and userID = ?;"; //check email and favorite is in the database
				connection.query(checkQuery, [movieTitle, userID], (error, results, field)=>{
					if(results.length ==0){ //nothing is found in the database
						resolve(email);
					}else{
						resolve("someing in DB");
					}
				});
			})
		}
		function getUserFromDB(email){
			return new Promise((resolve, reject)=>{
				var getuserIdQuery = 'select id from users where email =?;';
				connection.query(getuserIdQuery, [email], (error,results,field)=>{
					var id = results[0].id;
					resolve(id);
				});
			})
		}
		function insertToDB(id, postPath, movieTitle){
			return new Promise((resolve, reject)=>{
				var insertQuery = "insert into favorite (userID, imageUrl, title) values (?, ?, ?);";
				console.log(id);
				connection.query(insertQuery, [id, postPath, movieTitle], (error, results, field)=>{
					resolve("success");
				});
			})
		}

		function getMoiveToView(email){
			return new Promise((resolve, reject)=>{
				var selectQ = "select f.title, f.imageUrl, f.userID from favorite as f join users as u on f.userID = u.id where u.email=? ;";
				connection.query(selectQ, [email], (error, results, field)=>{
					resolve({
						baseImageUrl:imageBaseUrl,
						result: results
					})
				});
			})
		}
		checkEmailInDB(email)
		.then((userID)=>{
			// console.log(userID);
			// console.log(email);
			return checkWhatsInDB(movieTitle, userID, email)
		})
		.then((data)=>{
			console.log(data);
			// console.log(email);
		 	return getUserFromDB(data)
		})
		.then((id)=>{
			return insertToDB(id, postPath, movieTitle)
		})
		.then((useless)=>{
			return getMoiveToView(email)
		})
		.then((result)=>{
			console.log(result);
			return res.render("fav", {result: result});
		})

		// step ONE
			// check to see if it's already in the database
	// 	var getID = "select id from users where email = ?;";
	// 	connection.query(getID, [email], (error, results, field)=>{
	// 		var userI = results[0].id;
	// 		var checkQuery = "select title from favorite where title = ? and userID = ?;"; //check email and favorite is in the database
	// 		connection.query(checkQuery, [movieTitle, userI], (error, results, field)=>{
	// 			if(results.length ==0){ //nothing is found in the database
	// 				var getuserIdQuery = 'select id from users where email =?;';
	// 				connection.query(getuserIdQuery, [email], (error,results,field)=>{
	// 					console.log(results);
	// 					var id = results[0].id;
	// 					var insertQuery = "insert into favorite (userID, imageUrl, title) values (?, ?, ?);";
	// 					console.log(id);
	// 					connection.query(insertQuery, [id, postPath, movieTitle], (error, results, field)=>{
	// 						// get the image url and title from fav and joining users to check who's favorites we are getting by using email because email cannot be duplicated
	// 						var selectQ = "select f.title, f.imageUrl, f.userID from favorite as f join users as u on f.userID = u.id where u.email=? ;";
	// 						connection.query(selectQ, [email], (error, results, field)=>{
	// 							res.render("fav", {
	// 								baseImageUrl:imageBaseUrl,
	// 								result: results
	// 							});
	// 						});
	// 					});
	// 				});
	// // 			}else{
	// 				var selectQ = "select f.title, f.imageUrl, f.userID from favorite as f join users as u on f.userID = u.id where u.email=? ;";
	// 				connection.query(selectQ, [email], (error, results, field)=>{
	// 					res.render("fav", {
	// 						baseImageUrl:imageBaseUrl,
	// 						result: results
	// 					});
	// 				});
	// 			}
	// 		});
	// 	});

	// }else{
	// 	res.redirect("/nowplaying?msg=notloggedin");
	}
});
// display what you already have in the database
router.get("/favorite", (req, res, next)=>{
	// var selectQ = "select f.title, f.imageUrl, f.userID from favorite as f join users as u on f.userID = u.id where u.email=? ;";
	// connection.query(selectQ, [email], (error, results, field)=>{
	// 	res.render("fav", {
	// 		baseImageUrl:imageBaseUrl,
	// 		result: results
	// 	});
	// });

	// STEP ONE
		//Check which user are you and if you are logged in
	// Load the page with what you have in the databse
})

module.exports = router;



// TODO: favorites nav bar doesnt work because it needs to check vs database, only works when you log in first
// TODO: after you log in, you should be able to click on favorite to list your favorites