process.on('unhandledRejection', console.dir);

const watson = require('watson-developer-cloud');

const express = require('express');
const request = require('request');
const line = require('@line/bot-sdk');
const rpromise = require('request-promise');
const fs = require('fs');
const bparser = require('body-parser');
require('date-utils');

const PORT = process.env.PORT || 3000;

const app = express();
app.listen(PORT);
console.log(`Server running at ${PORT}`);
app.use('/addreq',bparser.json());
app.use('/connect',bparser.json());
app.use('/line',bparser.json());

const assistant = new watson.AssistantV1({
   username: 'aadb4a3d-ab32-436b-880f-9227359a8b6d',
   password: '6y6GE7RHC4pm',
   version: '2018-02-16'
});

const config = {
	channelAccessToken:'w0Mw/03wtGD6+DURpawqo5SqyYz5twdRU+oTkOwi7tj8ovkqyiT+eJ6CJr2Fm+aWl06s/9fbmK4vqQVaeQEafrF5ycawfny/Mcd26mkhEl3MQw8j2M+qw0n6jzNrelYoCNsO0W5bdqxAyqJcAE2ShgdB04t89/1O/w1cDnyilFU=',
	channelSecret: 'c846bb734fd1bbde3da1ec90cc3b9943'
};

//あとで消す
//app.post('/line', function(req,res){
//	console.log(req.body);
//});

app.post('/webhook', line.middleware(config), (req,res) => {
	console.log(req.body.events);
	
	Promise
		.all(req.body.events.map(handleEvent))
		.then((result) => res.json(result));
	
	//console.log(handleEvent(req.body.events));
	//受け取ったら
	//addA(req.body);
});

app.post('/addreq', async function(req, res) {
	addreq(req.body);
});

app.post('/connect', async function(req,body, res) {
	console.log(req.body);

	connect(req.body.magic_word);
});

const client = new line.Client(config);

let user_input;
let workspaceid;
//返答の登録
async function handleEvent(event) {
	//ユーザ認証
	let lineid = event.source.userId;
	let magicword = "";
	let workspaceId;
	let userjson = JSON.parse(fs.readFileSync('connect/users.json'));
	let index = -1;
	for(let item in userjson) {
		if(userjson[item].line_id == lineid) {
			magicword = userjson[item].magic_word;
			workspaceId = userjson[item].workspace_id;
			index = item;
		}
	}
	if (index<0) {
		magicword = event.message.text;
  	for(let item in userjson) {
  		if(userjson[item].magic_word == magicword) {
  			index = item;
  		}
		}
		if(index > -1) {
			userjson[index].line_id = lineid;
			fs.writeFileSync('connect/users.json',
				JSON.stringify(userjson, null, '    '));
		} else {
			return client.replyMessage(event.replyToken, {
				type:'text',
				text:'その合言葉は登録されてないよ'
			});

		}
		return client.replyMessage(event.replyToken, {
			type:'text',
			text: `合言葉は${userjson[index].magic_word}だね．用があったら連絡するよ．`
		});
	}
	//intentsmemoryと照合し，何もないときは雑談

	//普通の登録
	
	//addA(lineId, event.source.message.text);
	let answer = event.message.text;
	let intent;
	let intentjson = JSON.parse(fs.readFileSync('intentsMemory.json', 'utf8'));
	let isfind = false;
	for(let item in intentjson) {
		if(intentjson[item].magic_word == magicword) {
			intent = intentjson[item].intent;
			//見つけたから消す
			isfind = true;
		}
	}
	if(isfind){
		const newData = intentjson.filter(function(item, index){
			  if (item.magic_word != magicword) return true;
		});

		intentjson = newData;
		fs.writeFileSync('intentsMemory.json',
			JSON.stringify(intentjson, null, '  '));
	}
	let params = {
		workspace_id: workspaceId,
		intent: intent,
		examples: [ 
		{
			text: intent
		}
		]
	};

	assistant.createIntent(params, function(err, res) {
		if (err) {
			console.log(`workspaceId:${params.workspace_id}`);
			console.log(`intent:${params.intent}`);
			console.error("watsonのエラー！！！"+err);
		} else {
			console.log(JSON.stringify(res, null, 2));
	  	const dt = new Date();
			const formatted = dt.toFormat('YYMMDDHHMISS');
			params = {
	 			workspace_id: workspaceId,
				dialog_node: formatted,
			  conditions:`#${intent}`,
				output: {
					text: answer
				},
				title: intent
			};

			assistant.createDialogNode(params, function(error, response) {
				if (error) {
					console.error("dialogのエラー！！！"+error);
				} else {
					console.log(JSON.stringify(response, null, 2));
				
					return client.replyMessage(event.replyToken, {
						type:'text',
						text:'今度きかれたらそう言うね'
					});
				}
			});
		}
	});

	
}

//返答依頼
async function addreq(body) {
//intent候補を記録しておく
	let intentjson = JSON.parse(fs.readFileSync('intentsMemory.json','utf8'));
	let index = -1;
	for(let item in intentjson) {
		if(intentjson[item].magic_word == body.magic_word) {
			index = item;
		}
	}
	if(index<0) {
		const addjson = {
			magic_word : body.magic_word,
			intent : body.intent
		}
		json.push(addjson);

		fs.writeFileSync('intentsMemory.json',
			JSON.stringify(intentjson, null, '  '));
		index = json.length-1;
	}

	let lineId;
	let userjson = JSON.parse(fs.readFileSync('connect/users.json','utf8'));
	index = -1;
	for(let item in userjson) {
		if(userjson[item].magic_word == body.magic_word) {
			index = item;
			lineId = userjson[item].line_id;
		}
	}
	//push通知をする
	const message = {
		type: 'text',
		text: `「${body.intent}」だって．なんて答えればいいかなあ？」`
	};

	client.pushMessage(lineId, message)
	  .then(() => {
		console.log('success');
	})
		.catch((err) => {
		console.error(err);
	});
}

//おばあちゃんと連携
//watsonのworkspaceをつくる
async function connect(magicword) {
	console.log(magicword);
	//おばあちゃんのIDとworkspaceIDをjsonに記録
	// workspaceのリストを取得
	await assistant.listWorkspaces(async function (err, res) {
		if (err) {
			console.error(err);
		} else {
			//console.log(res);
			let list;
			//list = JSON.stringify(res, null, 2);
			list = res;
			list = list.workspaces;
			console.log(list);

			//該当するworkspaceを探し，IDを取得
			let index = -1;
			let workspaceid;
			for(let item in list) {
				if(list[item].name == magicword) {
					workspaceid = list[item].workspace_id;
					console.log(workspaceid);
				}
			}
			let json = JSON.parse(fs.readFileSync('connect/users.json', 'utf8'));
			
			const addjson = {
				line_id : null,
				magic_word : magicword,
				workspace_id : workspaceid
			}
			json.push(addjson);
			fs.writeFileSync('connect/users.json',
				JSON.stringify(json, null, '    '));
			console.log(json);
		}
	});
	
}

//ユーザ情報の削除
// workspaceの削除
