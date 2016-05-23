var Promise = require("promise");
var Git = require('nodegit');

function GITManager() {}

// TODO: promisified this method
GITManager.getCommitsForBranch = function (repoPath, branchName, response) {
    Git.Repository.open(repoPath)
        .then(function (repo) {
            return repo.getBranchCommit(branchName);
        })
        .then(function (firstCommitOnMaster) {
            var history = firstCommitOnMaster.history();

            var commits_data = [];

            history.on("end", function(commits) {
                for (var commit in commits) {
                    commits_data.push({
                        sha: commits[commit].sha(),
                        author: {
                            name: commits[commit].author().name(),
                            email: commits[commit].author().email()
                        },
                        message: commits[commit].message()
                    });
                }

                response.send(commits_data);
            });

            history.start();
        });
};

GITManager.getCommitDiff = function(repoPath, ranchName, sha, response) {
    return Git.Repository.open(repoPath)
        .then(function(repo) {
            return repo.getCommit(sha);
        })
        .then(function (commit) {
            return commit.getDiff();
        })
        .then(function(diffs) {
            return new Promise(function (resolve, reject) {
                var gitDiffs = [];
                var diffsCounter = 0;
                diffs.forEach(function(diff) {
                    diff.patches().then(function(patches) {
                        var gitPatches = [];
                        var patchesCounter = 0;
                        patches.forEach(function(patch) {
                            patch.hunks().then(function(hunks) {
                                gitHunks = [];
                                var hunksCounter = 0;
                                hunks.forEach(function(hunk) {
                                    hunk.lines().then(function(lines) {
                                        var file = {
                                            oldName: patch.oldFile().path(),
                                            newName: patch.newFile().path(),
                                            diff: []
                                        };
                                        lines.forEach(function(line) {
                                            var lineChange = {
                                              change: String.fromCharCode(line.origin()),
                                              diff: line.content().trim()
                                            };
                                            file.diff.push(lineChange);
                                            console.log(String.fromCharCode(line.origin()));
                                        });
                                        gitHunks.push(file);
                                        hunksCounter++;
                                        if (hunks.length === hunksCounter) {
                                            patchesCounter++;
                                            gitPatches.push(gitHunks);
                                        }
                                        if (patches.length === patchesCounter) {
                                            diffsCounter++;
                                            gitDiffs.push(gitPatches);
                                        }
                                        if (diffs.length === diffsCounter) {
                                            resolve(gitDiffs);
                                        }
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
};

GITManager.getStatus = function (repoPath) {
  return Git.Repository.open(repoPath)
      .then(function (repo) {
          return repo.getStatus().then(function (statuses) {
              function statusToText(status) {
                  var words = [];
                  if (status.isNew()) { words.push("NEW"); }
                  if (status.isModified()) { words.push("MODIFIED"); }
                  if (status.isTypechange()) { words.push("TYPECHANGE"); }
                  if (status.isRenamed()) { words.push("RENAMED"); }
                  if (status.isIgnored()) { words.push("IGNORED"); }

                  return words;
              }

              var filesStatuses = [];
              statuses.forEach(function(file) {
                 filesStatuses.push({
                     filePath: file.path(),
                     statuses: statusToText(file)
                 });
              });

              return new Promise(function (resolve, reject) {
                  resolve(filesStatuses);
              });
          });
      })
};

GITManager.getBranches = function(repoPath, response) {
    return Git.Repository.open(repoPath)
        .then(function (repo) {
           return repo.getReferenceNames(Git.Reference.TYPE.OID)
               .then(function(branches) {
                   var filteredBranches = [];

                   branches.forEach(function(branch) {
                       if (branch.indexOf('head') > -1)
                           filteredBranches.push(branch.split('/').pop());
                   });

                   return new Promise(function(resolve, reject) {
                       resolve(filteredBranches)
                   })
               });
        });
};

GITManager.createBranch = function(repoPath, branchName, response) {
  return Git.Repository.open(repoPath)
      .then(function (repo) {
          return repo.getHeadCommit()
              .then(function (commit) {
                  return repo.createBranch(
                      branchName,
                      commit,
                      0,
                      repo.defaultSignature(),
                      "Create new-branch on HEAD"
                  );
              });
      });
};

module.exports = GITManager;
