(function() {
var socket = io();

const backButton = document.querySelector('.back-button');
const sendButton = document.querySelector('.send');
const chatArea = document.querySelector('.chat-area');
const chatWindow = document.querySelector('.chat-container');
const chatLinks = document.querySelectorAll('.match-block-link');

const inputField = document.querySelector('.input');


let userName = 'Janno';
let roomId;

// {
//     "name":"saskia",
//     "roomID":"mattch",
//     "herImage":"hhh",
//     "hisImage":"",
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

chatLinks.forEach(match =>{
    match.addEventListener('click', (e)=>{
        e.preventDefault();
        roomId = e.target.dataset.room
        chatArea.classList.toggle('down');
        socket.emit('open chat', roomId); 
        // TODO: send appropriate chat room id with emit
    })
});

backButton.addEventListener('click', ()=>{
    chatArea.classList.toggle('down');
});


socket.on('open chat', function(data){
    chatWindow.innerHTML = '';
    data.forEach(messageObject => {
        const messageToRender = buildAMessage(messageObject.from, messageObject.msg, messageObject.time);
        chatWindow.insertAdjacentHTML('beforeend', messageToRender);
    });
    scrollToEnd();
});


socket.on('chat message', function(data){
    const messageToRender = buildAMessage(data.from, data.msg, data.time);
    chatWindow.insertAdjacentHTML('beforeend', messageToRender);
    scrollToEnd();
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
        
    //   const messageId = Math.floor(Math.random() * 99999999) + 1;
            const timestamp = getCurrentTime();
            socket.emit('chat message', {
                sender: userName,
                msg: message,
                time: timestamp,
                room: roomId
                // msgId: messageId
              });
            clearInputfieldAndFocus();
}

}());