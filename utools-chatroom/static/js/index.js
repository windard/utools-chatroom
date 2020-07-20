$(document).ready(function($) {

Date.prototype.Format = function(fmt)
{ //author: meizz
	var o = {
	"M+" : this.getMonth()+1,                 //月份
	"d+" : this.getDate(),                    //日
	"h+" : this.getHours(),                   //小时
	"m+" : this.getMinutes(),                 //分
	"s+" : this.getSeconds(),                 //秒
	"q+" : Math.floor((this.getMonth()+3)/3), //季度
	"S"  : this.getMilliseconds()             //毫秒
	};
	if(/(y+)/.test(fmt))
		fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
	for(var k in o)
		if(new RegExp("("+ k +")").test(fmt))
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
	return fmt;
}

if (!window.MozWebSocket && !window.WebSocket ){
	alert("你的浏览器不支持websocket.");
	return
}

var needNickname = function(){
	console.log("needNickname");
	$("#nickname-error").hide();
	$("#login-modal").modal({
		keyboard:false,
		backdrop:"static"
	});
	$('#login-modal').on('shown.bs.modal', function () {
		$("#nickname-edit").focus();
	})
};

var setNicknameError = function(_error_message){
	console.log("setNicknameError : " + _error_message);
	$("#nickname-error-message").text(_error_message);
	$("#nickname-error").show();
	$('#nickname-edit').focus();
};

var setNicknameSuccess = function(_new_nickname){
	console.log("setNicknameSuccess : " + _new_nickname);
	$("#login-modal").modal("hide");
	$("#my-nickname").text(_new_nickname);
	$("input[id=input-edit]").focus();
};

var sayMessageError = function(_error_message){
	console.log("sayMessageError: "+sayMessageError);
};

var serverMessage = function(_message){
	console.log("serverMessage: "+_message);
	chat_Socket.serverMessage(_message, chat_Socket.getLocalHMS());
};

var messageError = function (_message) {
	console.log("messageError: "+_message);
	chat_Socket.messageError(_message, chat_Socket.getLocalHMS());
}

var userMessage = function(_message){
	_nick_name = _message['username'];
	_content = _message['content'];
	// _nick_name = _message.split("$")[0];
	// _content = _message.split("$")[1];
	console.log(_nick_name + " say: " + _content);
	chat_Socket.userMessage(_nick_name, _content, chat_Socket.getLocalHMS());
};

var userImage = function (_message) {
	_nick_name = _message['username'];
	_content = _message['content'];
	console.log(_nick_name + " send: " + _content);
	chat_Socket.userImage(_nick_name, _content, chat_Socket.getLocalHMS());
}

var userList = function(_list){
	console.log("userList: "+_list);
	// _list = _list.split("$");
	chat_Socket.userList(_list);
};

var userJoin = function(_nick_name){
	console.log("userJoin: "+_nick_name);
	if( _nick_name == $("#my-nickname").text())
		return
    // chat_Socket.addUserToList(_nick_name);
    // chat_Socket.updateListCount();
    chat_Socket.serverMessage(_nick_name+" 加入了聊天室 (*^__^*) …… ",chat_Socket.getLocalHMS());
};

var userQuit = function(_nick_name){
	console.log("userQuit: "+_nick_name);
    // chat_Socket.removeUserFromList(_nick_name);
    // chat_Socket.updateListCount();
    chat_Socket.serverMessage(_nick_name+" 离开了聊天室 ( ⊙ o ⊙ ) … ",chat_Socket.getLocalHMS());
};


var websocket_url = (location.protocol === "https:" ? 'wss://' : 'ws://') +
	location.hostname + (location.port ? ':'+location.port: '') + "/websocket" +
	location.pathname;

socket = new ReconnectingWebSocket("ws://39.105.91.194:8090/websocket/", null, {"maxReconnectAttempts": 2});


ReconnectingWebSocket.prototype.onmessage = function(event) {
	data = JSON.parse(event.data);
	action = data['action'];
	message = data['message'];
	switch (action) {
		case "needNickname": needNickname();
							break;
		case "setNicknameError": setNicknameError(message);
							break;
		case "setNicknameSuccess": setNicknameSuccess(message);
							break;
		case "sayMessageError": sayMessageError(message);
							break;
		case "serverMessage": serverMessage(message);
							break;
		case "userMessage": userMessage(message);
							break;
		case "messageError": messageError(message);
							break;
		case "userImage": userImage(message);
							break;
		case "userList": userList(message);
							break;
		case "userJoin": userJoin(message);
							break;
		case "userQuit": userQuit(message);
							break;
		case "heartbeat": break
		default: console.log("Error:"+action);
	}
};


ReconnectingWebSocket.prototype.onopen = function(event) {
	chat_Socket.hideReconnection()
	chat_Socket.serverMessage("你已进入聊天室", chat_Socket.getLocalHMS());
	ReconnectingWebSocket.prototype.socketHeartbeat = setInterval(function()
	{
		socket.send(JSON.stringify({"action": "heartbeat", "message": "ping"}));
	}, 10000); //10000 milliseconds = 10 seconds
};

ReconnectingWebSocket.prototype.onclose = function(event) {
	clearInterval(ReconnectingWebSocket.prototype.socketHeartbeat);
	chat_Socket.serverMessage("聊天室已关闭。。。", chat_Socket.getLocalHMS());
};

ReconnectingWebSocket.prototype.ontotalclose = function(event) {
	chat_Socket.showReconnection();
};

chat_Socket = {
	init: function(){
		this.initEmotion();
		this.initMessage();
		this.sendNickname();
	},
	initEmotion: function(){
		QxEmotion($('#emotion-btn'), $('#input-edit'));
	},
	initMessage: function(){
		var self = this;
		$("#send-message").on("click", function(event){
			event.preventDefault();
			self.applyMessage();
		});
		$("#msg-list-body").on("click", "#reconnection", function(event){
			event.preventDefault();
			socket.open();
		});
		$("form").submit(function(event) {
			event.preventDefault();
			self.applyMessage();
		});
	},
	applyMessage: function(){
		var content = $("input[id=input-edit]").val();
		if(content){
			this.sendMessage(content)
			$("input[id=input-edit]").val('');
		}
	},
	sendMessage: function(content){
		socket.send(JSON.stringify({"action":"message", "message":content}));
	},
	sendImage: function(content){
		socket.send(JSON.stringify({"action":"image", "message":content}));
	},
	sendNickname: function(){
		var self = this;
		$("#nickname-edit").keydown(function(event){
			if( event.keyCode == 13)
				self.applyNickname();
		});
		$("#applyNicknameBtn").on('click', function(){
			self.applyNickname();
		})
	},
	applyNickname: function(){
		var nickname_edit = $("#nickname-edit");
		var nickname_error = $("#nickname-error");
		var nickname = nickname_edit.val();
		if (nickname.trim() == ""){
			$("#nickname-error-message").text("请填写昵称。");
			nickname_error.show();
			nickname_edit.focus();
			return;
		}
		if (nickname.length > 20 ){
			$("#nickname-error-message").text("昵称过长，长度应小于20个字符。");
			nickname_error.show();
			nickname_edit.focus();
			return;
		}
		socket.send(JSON.stringify({"action":"setNickname", "message":nickname}));
	},
	chatBodyToBottom: function(){
		// var chat_body = $('.main #chat-board');
		var chat_body = document.getElementById('chat-board');
		chat_body.scrollTop = chat_body.scrollHeight + 10000;
	},
	serverMessage: function(_content, _time){
		_content = QxEmotion.Parse(_content);
		var messages = $(".msg-list-body");
		var message = '<div class="text-center sys-message">\
							<span class="sys-tip"> 系统消息: '+_content+'    &nbsp;'+_time+'</span>\
						</div>';
		messages.append(message);
		this.chatBodyToBottom();
	},
	hideReconnection: function(){
		$("button.reconnection").hide();
	},
	showReconnection: function(){
		var messages = $(".msg-list-body");
		var message = '<button type="button" id="reconnection" class="center-block btn btn-success reconnection">ReConnection</button>'
		messages.append(message);
		this.chatBodyToBottom();
	},
	messageError: function(_content, _time){
		_content = QxEmotion.Parse(_content);
		var messages = $(".msg-list-body");
		var message = '<div class="text-center sys-message">\
							<span class="error-msg"> 发送异常: '+_content+'    &nbsp;'+_time+'</span>\
						</div>';
		messages.append(message);
		this.chatBodyToBottom();
	},
	userMessage: function(_nick_name, _content, _time){
		_content = QxEmotion.Parse(_content);
		var messages = $(".msg-list-body");
		var nickname = $("#my-nickname").text();
		var textalign = _nick_name == nickname ? "text-right" : "";
		var label =  _nick_name == nickname ? "label-success" : "label-info";
		var message = '<div class="message jumbotron '+textalign+' ">\
							<div class="message-head">\
								<span class="label '+label+'"><span class="glyphicon glyphicon-user"></span>&nbsp;&nbsp;'+_nick_name+'</span>&nbsp;&nbsp;\
								<span class="label label-default"><span class="glyphicon glyphicon-time"></span>&nbsp;&nbsp;'+_time+'</span>&nbsp;&nbsp;\
							</div>\
							<div class="message-body">\
								'+_content+'\
							</div>\
						</div>';
		messages.append(message);
		this.chatBodyToBottom();
	},
	userImage: function(_nick_name, _content, _time){
		_content = QxEmotion.Parse(_content);
		var messages = $(".msg-list-body");
		var nickname = $("#my-nickname").text();
		var textalign = _nick_name === nickname ? "text-right" : "";
		var label =  _nick_name === nickname ? "label-success" : "label-info";
		var message = '<div class="message jumbotron '+textalign+' ">\
							<div class="message-head">\
								<span class="label '+label+'"><span class="glyphicon glyphicon-user"></span>&nbsp;&nbsp;'+_nick_name+'</span>&nbsp;&nbsp;\
								<span class="label label-default"><span class="glyphicon glyphicon-time"></span>&nbsp;&nbsp;'+_time+'</span>&nbsp;&nbsp;\
							</div>\
							<div class="message-body">\
								<img onload=loaded_image() class="message-image" src="'+_content+'" alt="image" > \
							</div>\
						</div>';
		messages.append(message);
		this.chatBodyToBottom();
	},
	userList: function(_list){
		$(".list .list-group").html("");
		if (_list[0] != "")
			for(var i = 0; i < _list.length; i++ ) {
				this.addUserToList(_list[i]);
			};
		this.updateListCount();
	},
	addUserToList: function(_nick_name){
		$(".list .list-group").append('<li class="list-group-item">'+_nick_name+'</li>');
	},
	removeUserFromList: function(_nick_name){
		$(".list .list-group li").each(function(){
			if(_nick_name == $(this).text()){
				$(this).remove();
			}
		});
	},
	updateListCount: function(){
		var list_count = $(".list .list-group").find("li").length;
		$("#list-count").text("当前在线人数："+list_count+"人");
	},
	getLocalHMS: function(){
		return new Date().Format("yyyy-MM-dd hh:mm:ss");
	},
}

chat_Socket.init();


    $("div#mainArea").dropzone({
        url: "http://39.105.91.194:8090/upload_image",
        paramName: "image",
        clickable: false,
		// 限制了也没有友好的提示
		// acceptedFiles: "image/*",
        addedfile: function (file) {
            return false;
        },
        success: function (file, response) {
            if (response.code === 0){
                chat_Socket.sendImage(response.data.url)
            } else {
                console.log("response: " + response.message)
                chat_Socket.messageError("文件上传失败", chat_Socket.getLocalHMS());
            }
        },
        dragenter: function (e) {
            $("#cover").removeClass("cover-empty");
            this.element.classList.add("dz-drag-hover");
        },

        dragover: function (e) {
            $("#cover").removeClass("cover-empty");
            this.element.classList.add("dz-drag-hover");
        },
        dragleave: function (e) {
            this.element.classList.remove("dz-drag-hover");
        },
        drop: function (e) {
            $("#cover").addClass("cover-empty");
            this.element.classList.remove("dz-drag-hover");
        },

    });

    document.getElementById("cover").ondragover = function () {
        $("#cover").addClass("cover-empty");
        return false;
    }
    document.getElementById("cover").ondragleave = function () {
        $("#cover").addClass("cover-empty");
        return false;
    }
    // 全局阻止放下图片事件，禁止浏览器默认行为
    window.ondrag=function(e) {
        e.preventDefault();
        return false
    }
    window.ondragover=function(e) {
        e.preventDefault();
        return false
    }
    window.ondrop=function(e) {
        e.preventDefault();
        return false
    }

    function send_file(file) {
        var fd = new FormData();
        fd.append("image", file)

        $.ajax({
            url: 'http://39.105.91.194:8090/upload_image',
            type: 'post',
            data: fd,
            contentType: false,
            processData: false,
            success: function(response){
                if(response.code === 0){
                    chat_Socket.sendImage(response.data.url)
                }else{
                    console.log("response" + response.message)
                    chat_Socket.messageError("文件上传失败", chat_Socket.getLocalHMS());
                }
            },
        });
    }

    document.addEventListener('paste', function (event) {
        var items = event.clipboardData && event.clipboardData.items;
        var file = null;
        if (items && items.length) {
            // 检索剪切板items
            for (var i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    file = items[i].getAsFile();
                    break;
                }
            }
        }

        if (file === null){
            return false;
        }
        var extIndex = file.name.lastIndexOf(".");
        var extValue = file.name.substring(extIndex+1).toLowerCase();
        if (extValue !== "jpg" && extValue !== "jpeg" && extValue !== "png" && extValue !== "gif"){
            chat_Socket.serverMessage("非图片文件", chat_Socket.getLocalHMS());
            return false;
        }
        send_file(file)

    });

});

function loaded_image() {
	chat_Socket.chatBodyToBottom();
}
