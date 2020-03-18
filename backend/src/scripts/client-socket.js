(function() {
var socket = io();

const backButton = document.querySelector('.back-button');
const unMatchHeart = document.querySelector('.unmatch-heart');
const unmatchQuestion = document.querySelector('.unmatch-question');
const unmatchPopup = document.querySelector('.unmatch-popup');
const unmatchPerson = document.querySelector('.unmatched-person');
const yesUnmatch = document.querySelector('.yea-unmatch');
const dontUnmatch = document.querySelector('.dont-unmatch');
const sendButton = document.querySelector('.send');
const chatArea = document.querySelector('.chat-area');
const chatWindow = document.querySelector('.chat-container');
const chatLinks = document.querySelectorAll('.match-block-link');
const newmachtChatLinks = document.querySelectorAll('.new-match-container-item');
const jannoBlock = document.querySelector('.janno-block');

const chatTitle = document.querySelector('.chat-name');
const chatImage = document.querySelector('.chat-img');

const inputField = document.querySelector('.input');


let userName = 'Janno';
let roomId;
let talkingTo;
let isNewMatch = false;

// {
//     "name":"saskia",
//     "roomID":"mattch",
//     "herImage":"hhh",
//     "hisImage":"",
//     "lastMessage":""
//     }
// {
//     "name":"Charlie",
//     "roomID":"match-charlie-Janno-5e6fbd3f38f8fc7b1ce48165",
//     "herImage":"https://i.redd.it/i3qlw1aid7g21.jpg",
//     "hisImage":"https://avatars1.githubusercontent.com/u/11157347?s=460&v=4",
//     "lastMessage":"chachacha",
//      "hisName":"Janno"
//     }
// {
//     "name":"Claudia",
//     "roomID":"match-Claudia-Janno-5e6fcac84d32897c95566666",
//     "herImage":"https://thumbor.pijper.io/RaHRNIppbLZxvOdCjNmSIdeUNBc=/1290x726/center/middle/https://cdn.pijper.io/2019/12/w5m5CsnDylIwC71576744636.jpeg",
//     "hisName":"Janno",
//     "hisImage":"https://avatars1.githubusercontent.com/u/11157347?s=460&v=4",
//     "lastMessage":""
//     }

function scrollToEnd(){
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function buildAMessage(sender, messageContent, timestamp){
    let setToSide;
    sender == userName? setToSide = 'my-message': setToSide = '';
    let aMessage = `<li class="message ${setToSide}"><p>${messageContent}</p><span>${timestamp}</span></li>`;
    return aMessage;
}

function updateLastMessages(lastMessage, room){
    chatLinks.forEach(chatLink =>{
        if(chatLink.dataset.room == room){
            chatLink.querySelector('.last-message').textContent = lastMessage;
        }
    });
}

function clearInputfieldAndFocus(){
    document.querySelector('.input').value = "";
    document.querySelector('.input').focus();
    //maybe change the placeholder depending on input? user feedback iets
}

function getCurrentTime(){
    let minutes = new Date().getMinutes()
    let hours = new Date().getHours()
    const timestamp = hours + ":" + minutes;
    return timestamp
}

function setImageAndName(img, name){
    chatTitle.textContent = name;
    chatImage.src = img;
}

function renderMessagePrompt(){
    const sendMessagePrompt = `<li class="prompt"><p>Send a message and she might actually reply</p></li>`;
    chatWindow.innerHTML = "";
    chatWindow.insertAdjacentHTML('beforeend', sendMessagePrompt)
}

function addChatListeners(chatLink, newMatch){
    chatLink.addEventListener('click', (e)=>{
        e.preventDefault();
        roomId = e.target.dataset.room
        let matchName = e.target.dataset.name
        let matchImg = e.target.dataset.img
        talkingTo = e.target.dataset.name;
        setImageAndName(matchImg, matchName)
        chatArea.classList.toggle('down');
        if(talkingTo == "Janno"){
            userName = "Charlie"
        }
        if(newMatch){
            isNewMatch = true;
            renderMessagePrompt();
        }else{
            isNewMatch = false;
            socket.emit('open chat', roomId); 
        };
    })
}

newmachtChatLinks.forEach(chat =>{
    addChatListeners(chat, true);
})
chatLinks.forEach(chat =>{
    addChatListeners(chat, false);
})
addChatListeners(jannoBlock);

backButton.addEventListener('click', (e)=>{
    e.preventDefault();
    if(isNewMatch == 'reload'){
        location.reload();
    }
    socket.emit('leave room', roomId);
    chatArea.classList.toggle('down');
});


unMatchHeart.addEventListener('click', (e)=>{
    e.preventDefault();
    unmatchQuestion.classList.toggle('hidden');
})

yesUnmatch.addEventListener('click', (e)=>{
    e.preventDefault();
    chatLinks.forEach(chatLink =>{
        if(chatLink.dataset.room == roomId){
            chatLink.remove();
        }
    });
    unmatchQuestion.classList.toggle('hidden');
    chatArea.classList.toggle('down');
    unmatchPopup.classList.toggle('hidden')
    setTimeout(() => {
        unmatchPopup.classList.toggle('hidden')
    }, 2000);
    unmatchPerson.textContent = talkingTo;
    socket.emit('unmatch', roomId);
})
dontUnmatch.addEventListener('click', (e)=>{
    e.preventDefault();
    unmatchQuestion.classList.toggle('hidden');
})


socket.on('open chat', function(data){
    chatWindow.innerHTML = '';
    data.forEach(messageObject => {
        const messageToRender = buildAMessage(messageObject.from, messageObject.msg, messageObject.time);
        chatWindow.insertAdjacentHTML('beforeend', messageToRender);
    });
    scrollToEnd();
});

socket.on('chat message', function(data){
    if(isNewMatch){
        chatWindow.innerHTML = "";
    }
    const messageToRender = buildAMessage(data.from, data.msg, data.time);
    chatWindow.insertAdjacentHTML('beforeend', messageToRender);
    scrollToEnd();
    updateLastMessages(data.msg, data.room);
});



sendButton.addEventListener("click", function(e) {
    e.preventDefault();
    sendMessage();
});

inputField.addEventListener("keydown", function(e) {
    if(e.key == 'Enter'){
        e.preventDefault();
        sendMessage();
    }
});



function sendMessage(){
    const message = inputField.value
    if(message.length < 1){
            clearInputfieldAndFocus();
            return
        }
        
            const timestamp = getCurrentTime();
            if(isNewMatch){
                isNewMatch = 'reload';
                socket.emit('make new chat', {
                    sender: userName,
                    msg: message,
                    time: timestamp,
                    room: roomId
                  });    
            }else{
                socket.emit('chat message', {
                    sender: userName,
                    msg: message,
                    time: timestamp,
                    room: roomId
                  });
            }
            clearInputfieldAndFocus();
}

}());