var express = require('express');
var bodyParser = require('body-parser');
var gitManager = require('./gitManager');
var app = express();

app.use(bodyParser.json());

app.use(function(req,res,next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Repo-Path");
    next();
});

app.get('/', function (req, res) {
   res.send("GIT Manager API :-)");
});

/*
* list of commits with basic information
* */
app.get('/commits/:branch/', function (request, response) {
   var repoPath = request.headers['repo-path'];
   var branchName = request.params.branch;
   gitManager.getCommitsForBranch(repoPath, branchName, response);
});

/*
* commit diff
* */
app.get('/commits/:branch/:sha/', function (request, response) {
   var repoPath = request.headers['repo-path'];
   var branchName = request.params.branch;
   var commitSha = request.params.sha;
   gitManager.getCommitDiff(repoPath, branchName, commitSha)
       .then(function(diff) {
          response.send(diff);
       });
});

/*
* git status
* */
app.get('/status', function(request, response) {
   var repoPath = request.headers['repo-path'];
   gitManager.getStatus(repoPath)
       .then(function (fileStatuses) {
         response.send(fileStatuses);
       });
});

/*
* get all branches
* */
app.get('/branches', function (request, response) {
   var repoPath = request.headers['repo-path'];
   gitManager.getBranches(repoPath)
       .then(function (branches) {
          response.setHeader('Content-Type', 'application/json');
          response.send(JSON.stringify(branches))
       });
});


/*
* create new branch
* */
app.post('/branch', function (request, response) {
   var repoPath = request.headers['repo-path'];
   branchName = request.body.name;
   gitManager.createBranch(repoPath, branchName)
       .catch(function() {
          response.status(400);
          response.setHeader('Content-Type', 'application/json');
          response.send(JSON.stringify({"message": "Improper branch name or branch with that name already exists in repo."}));
       }).then(function () {
           response.status(200);
           response.setHeader('Content-Type', 'application/json');
           response.send(JSON.stringify({"message": "New branch has benn created successfully."}));
       });
});


app.listen(3000, function () {
   console.log("GIT server has been started properly!")
});
