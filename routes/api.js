var express = require('express');
var router = express.Router();
var request = require('request');
var fs = require('fs');
var path = require('path');
var unixTime = require('unix-time');

var contest_info = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "config", "contest_info.json")));
var user_info = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "config", "user_info.json")));
var session_cookie_value = null;

// To get session, trying to log-in.
request.post({
  url: contest_info.contest_url + "/public/login.php",
  form: {
    cmd: "login",
    login: user_info.id,
    passwd: user_info.pw
  }
}, function(err, response, body) {
  if(err) {
    console.error("Failed to get session info!");
    process.exit(-1);
    return;
  }
  session_cookie_value = (response.headers["set-cookie"][0]).split(';')[0];
});

// Before get any information, check if logged-in and session key is available.
router.get('*', function(req, res, next) {
  if(session_cookie_value == null) {
    res.status(401);
    res.jsonp({
      state: false,
      message: "Not authorized yet. Please try again!",
      data: null
    });
  }
  else {
    next();
  }
});

router.get('/contest.json', function(req, res, next) {

  var get_contest_info = new Promise((resolve, reject) => {
    request({
      method: 'GET',
      uri: contest_info.contest_url + "/api/contests",
      headers: {
        Cookie: session_cookie_value
      }
    }, (error, response, body) => {
      if(error) {
        reject(error);

        return;
      }

      var response_body = JSON.parse(body);
      if(typeof response_body[contest_info.contest_id] == "undefined") {
        reject("Unable to get contest info!");
      }
      else {
        resolve(response_body[contest_info.contest_id]);
      }
    });
  });

  var get_system_info = new Promise((resolve, reject) => {
    request({
      method: 'GET',
      uri: contest_info.contest_url + "/api/info",
      headers: {
        Cookie: session_cookie_value
      }
    }, (error, response, body) => {
      if(error) {
        reject(error);

        return;
      }
      var response_body = JSON.parse(body);
      resolve(response_body);
    });
  });

  var get_problem_list = new Promise((resolve, reject) => {
    request({
      method: 'GET',
      uri: contest_info.contest_url + "/api/problems?cid=" + contest_info.contest_id,
      headers: {
        Cookie: session_cookie_value
      }
    }, (error, response, body) => {
      if(error) {
        reject(error);

        return;
      }
      var response_body = JSON.parse(body);
      resolve(response_body);
    });
  });

  var get_team_list = new Promise((resolve, reject) => {
    request({
      method: 'GET',
      uri: contest_info.contest_url + "/api/teams?category=" + contest_info.contest_team_category_id,
      headers: {
        Cookie: session_cookie_value
      }
    }, (error, response, body) => {
      if(error) {
        reject(error);

        return;
      }
      var response_body = JSON.parse(body);
      resolve(response_body);
    });
  });

  Promise.all([get_contest_info, get_system_info, get_problem_list, get_team_list])
      .then((values) => {
        var contest_json_data = {};
        contest_json_data.title = values[0].name;
        contest_json_data.systemName = "DOMjudge";
        contest_json_data.systemVersion = "Version " + values[1].domjudge_version + ", API Version " + values[1].api_version;

        var problemlist_converted = [];
        for(var i in values[2]) {
          let converted_data = {};
          converted_data.id = values[2][i].id;
          converted_data.name = values[2][i].label;
          converted_data.title = values[2][i].name;
          converted_data.color = values[2][i].color;

          problemlist_converted.push(converted_data);
        }
        contest_json_data.problems = problemlist_converted;

        contest_json_data.groups = [];

        var teamlist_converted = [];
        for(var i in values[3]) {
          let converted_data = {};
          converted_data.id = values[3][i].id;
          converted_data.name = values[3][i].name + " (" + values[3][i].affiliation + ")";

          teamlist_converted.push(converted_data);
        }
        contest_json_data.teams = teamlist_converted;

        res.jsonp(contest_json_data);
      }, (errors) => {
        res.status(500);
        res.jsonp({
          state: false,
          message: "Failed to get info",
          data: errors
        });
      });
});

router.get('/runs.json', function(req, res, next) {

  var get_contest_info = new Promise((resolve, reject) => {
    request({
      method: 'GET',
      uri: contest_info.contest_url + "/api/contests",
      headers: {
        Cookie: session_cookie_value
      }
    }, (error, response, body) => {
      if(error) {
        reject(error);

        return;
      }

      var response_body = JSON.parse(body);
      if(typeof response_body[contest_info.contest_id] == "undefined") {
        reject("Unable to get contest info!");
      }
      else {
        resolve(response_body[contest_info.contest_id]);
      }
    });
  });

  var get_submission_list = new Promise((resolve, reject) => {
    request({
      method: 'GET',
      uri: contest_info.contest_url + "/api/submissions?cid=" + contest_info.contest_id,
      headers: {
        Cookie: session_cookie_value
      }
    }, (error, response, body) => {
      if(error) {
        reject(error);

        return;
      }

      var response_body = JSON.parse(body);
      resolve(response_body);
    });
  });

  var get_judging_list = new Promise((resolve, reject) => {
    request({
      method: 'GET',
      uri: contest_info.contest_url + "/api/judgings?cid=" + contest_info.contest_id,
      headers: {
        Cookie: session_cookie_value
      }
    }, (error, response, body) => {
      if(error) {
        reject(error);

        return;
      }

      var response_body = JSON.parse(body);
      resolve(response_body);
    });
  });

  Promise.all([get_contest_info, get_submission_list, get_judging_list])
      .then((values) => {

        var runs_json_data = {};
        runs_json_data.time = {};
        runs_json_data.time.contestTime = ((unixTime(new Date()) < values[0].end) ? unixTime(new Date()) : values[0].end) - values[0].start;

        runs_json_data.time.noMoreUpdate = (values[0].freeze != null && values[0].freeze <= unixTime(new Date()));
        if(runs_json_data.time.noMoreUpdate == true && values[0].unfreeze != null && unixTime(new Date()) > values[0].unfreeze) {
          runs_json_data.time.noMoreUpdate = false;
        }

        runs_json_data.time.timestamp = unixTime(new Date());

        runs_json_data.runs = [];

        for(var i in values[1]) {
          for(var j in values[2]) {
            if(values[1][i].id == values[2][j].submission) {
              if(values[1][i].time <= values[0].end) {
                let runs_data = {};
                runs_data.id = values[1][i].id;
                runs_data.problem = values[1][i].problem;
                runs_data.team = values[1][i].team;
                runs_data.submissionTime = (values[1][i].time - values[0].start) / 60;
                if(runs_json_data.time.noMoreUpdate == true && values[1][i].time > values[0].freeze) {
                  runs_data.result = "Pending";
                }
                else {
                  switch(values[2][j].outcome) {
                    case "correct":
                      runs_data.result = "Yes";
                      break;

                    case "pending":
                      runs_data.result = "Pending";
                      break;

                    default:
                      runs_data.result = "No";
                      break;
                  }
                }

                let check_target_id = runs_data.id;
                let duplicate_element_index = runs_json_data.runs.findIndex((element, index, array) => element.id == check_target_id);
                if(duplicate_element_index != -1) {
                  runs_json_data.runs[duplicate_element_index] = runs_data;
                }
                else {
                  runs_json_data.runs.push(runs_data);
                }
              }
            }
          }
        }

        runs_json_data.runs.sort((A, B) => A.id - B.id);
        res.jsonp(runs_json_data);
      }, (errors) => {
        res.status(500);
        res.jsonp({
          state: false,
          message: "Failed to get info",
          data: errors
        });
      });
});

router.get('/changed_runs.json', function(req, res, next) {
  res.sendFile(path.join(__dirname, "..", "public", "sample", "changed_runs.json"));
});

router.get('/award_slide.json', function(req, res, next) {
  res.sendFile(path.join(__dirname, "..", "public", "sample", "award_slide.json"));
});

module.exports = router;
