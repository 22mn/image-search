var express = require("express");
var mongo   = require("mongodb").MongoClient();                 
var app     = express();
var bing    = require("node-bing-api")({accKey:"448619ae17c14693bed952f3a28e1f7c"});  //1 month api search key 
var porty   = process.env.PORT || 8080;
var path    = require("path");
var local   = process.env.SECRET;                               //mongodb path from mLab

app.get("/",function(req,res){
	res.sendFile(path.join(__dirname +"/index.html"));    //endpoint to index/home page
});

app.get("/:qry(*)&:cnt([0-9]{1,2})&:ofst([0-9]{1,2})",function(req,res){
	var record = {};                                            //to record search history and time
	var date = new Date();
	record["query"] = req.params.qry;
	record["time"] = date;	
	mongo.connect(local,function(err,db){
		if (err){console.log(err);}
		db.collection("history").insert(record,function(err,ok){  
			if (err){console.log(err);}
			console.log(ok);
		});
	});
	bing.images(req.params.qry,{                                //call bing images search function
		count:Number(req.params.cnt),                           //(query,{count,offset},callback)
		offset:Number(req.params.ofst)	
	}, function(err,ok,body){
		res.send(collect(body["value"]));                       //body include results and loop with collect
	});                                                         //function return array include result objects

});

app.get("/history/:lmt([0-9]{1,2})",function(req,res){           
	mongo.connect(local,function(err,db){
		if (err){console.log(err)}
		db.collection("history").find().sort({"time":-1}).limit(Number(req.params.lmt)).toArray(function(err,ok){
			res.send(ok.map(function(item){delete item["_id"];return item}));  //drop _id from return 
		});
	});
});

function collect(data){
	var arr = [];
	for (var i =0 ;i<data.length ;i++){
		var obj = {};
		obj["name"] = data[i].name;
		obj["content"] = data[i].contentUrl;
		obj["thumbnail"] = data[i].thumbnailUrl;
		obj["source"] = data[i].hostPageUrl;
		obj["published"] = data[i].datePublished;
		arr.push(obj);
	}
	return arr;
}

var listener= app.listen(porty,()=>{
	console.log("Your app is listening on port: "+listener.address().port);
});