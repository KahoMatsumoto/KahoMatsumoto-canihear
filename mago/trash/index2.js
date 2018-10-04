process.on('unhandledRejection', console.dir);

const watson = require('watson-developer-cloud');

const express = require('express');
const request = require('request');
const line = require('@line/bot-sdk');
const rp = require('request-promise');
const fs = require('fs');

const PORT = process.env.PORT || 3000;

const app = express();
app.listen(PORT);
console.log(`Server running at ${PORT}`);

const assistant = new watson.AssistantV1({
   username: 'aadb4a3d-ab32-436b-880f-9227359a8b6d',
   password: '6y6GE7RHC4pm',
   version: '2018-02-16'
});

const config = {
	channelAccessToken:'IdnMcD43WkuJjQ0YdI4jNEVKw9CXCdJF2FYPXeQP+KH4Y3fRTgA0TVPgCUF/uAIU+gClFRMPuIpraPZCDBjo0YA/8MBdsd6mlCYby/QYj69ZZ1tCUbnWPp8b/dDX2T2f5Ytr5TXis0i1IHqj927o+AdB04t89/1O/w1cDnyilFU=',
	channelSecret: 'a390188a836a592ff42c90eac1009e12'
};

app.post('/webhook', line.middleware(config), function(req,res) {
	user_input = req.body.message;
	console.log(user_input);
	res.json('お');
	
	//res.send('こんにちは');
	//addA();
});

app.post('/addreq', function(req, res) {
	addreq();
});

app.post('/connect', function(req, res) {
	connect();
});

let user_input;
//返答の登録
function addA() {
	
}

//返答依頼
function addreq() {
	//push通知をする
	//intent候補を記録しておく
}

//おばあちゃんと連携
function connect() {
	//watsonのworkspaceの生成
	//おばあちゃんのIDとworkspaceIDをjsonに記録
}




