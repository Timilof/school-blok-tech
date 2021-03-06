function featureCheck(feature, where, type) {
  return feature in where
      && type ?
          typeof where[feature] === type
          : true
}


function enableScript() {
  return featureCheck('classList', document.body)
      && featureCheck('Array', Array.prototype, 'function')
      && featureCheck('querySelectorAll', document.body, 'function')
      && featureCheck('getElementById', document.body)
      && featureCheck('forEach', document.body, 'function')
}

if (enableScript()) {
  // the rest of all javascript functionalities here...
  // if the browser doesn't support these features the user can use the application without javascript

(function() {
  var socket = io();

  const profile = document.querySelector(".switch-button");
  const profileButton = document.querySelector(".switch-link");
  const usernameField = document.querySelector(".username");
  const profilesPopup = document.querySelector(".popup-profiles");
  const profileImg = document.querySelector(".switch-link img");
  
  const containersForallMatches = document.querySelectorAll(".all-matches-container");
  
  const backButton = document.querySelector(".back-button");
  const unMatchHeart = document.querySelector(".unmatch-heart");
  const unmatchQuestion = document.querySelector(".unmatch-question");
  const unmatchPopup = document.querySelector(".unmatch-popup");
  const unmatchPerson = document.querySelector(".unmatched-person");
  const yesUnmatch = document.querySelector(".yea-unmatch");
  const dontUnmatch = document.querySelector(".dont-unmatch");
  const sendButton = document.querySelector(".send");
  const chatArea = document.querySelector(".chat-area");
  const chatWindow = document.querySelector(".chat-container");
  const chatLinks = document.querySelectorAll(".match-block-link");
  const matchBlock = document.querySelectorAll(".match-block");
  const newmachtChatLinks = document.querySelectorAll(
    ".new-match-container-item"
  );

  const chatTitle = document.querySelector(".chat-name");
  const chatImage = document.querySelector(".chat-img");

  const inputField = document.querySelector(".input");

  let isUserABoy = true;
  let userName = "Janno";
  let roomId;
  let talkingTo;
  let isNewMatch = false;


  matchBlock.forEach(link =>{
    link.style.pointerEvents = "none";
  })

  function scrollToEnd() {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function buildAMessage(sender, messageContent, timestamp) {
    let setToSide;
    sender == userName ? (setToSide = "my-message") : (setToSide = "");
    let aMessage = `<li class="message ${setToSide}"><p>${messageContent}</p><span>${timestamp}</span></li>`;
    return aMessage;
  }

  function updateLastMessages(lastMessage, room) {
    chatLinks.forEach(chatLink => {
      if (chatLink.dataset.room == room) {
        chatLink.querySelector(".last-message").textContent = lastMessage;
      }
    });
  }

  function clearInputfieldAndFocus() {
    document.querySelector(".input").value = "";
    document.querySelector(".input").focus();
    //maybe change the placeholder depending on input? user feedback iets
  }

  function getCurrentTime() {
    let minutes = new Date().getMinutes();
    let hours = new Date().getHours();
    const timestamp = hours + ":" + minutes;
    return timestamp;
  }

  function setImageAndName(img, name) {
    chatTitle.textContent = name;
    chatImage.src = img;
  }

  function renderMessagePrompt() {
    const sendMessagePrompt = `<li class="prompt"><p>Send a message and she might actually reply</p></li>`;
    chatWindow.innerHTML = "";
    chatWindow.insertAdjacentHTML("beforeend", sendMessagePrompt);
  }

  function addChatListeners(chatLink, newMatch) {
    chatLink.addEventListener("click", e => {
      e.preventDefault();
      roomId = e.target.dataset.room;
      let matchName = e.target.dataset.name;
      let matchImg = e.target.dataset.img;
      talkingTo = e.target.dataset.name;
      setImageAndName(matchImg, matchName);
      chatArea.classList.toggle("down");
      if (newMatch) {
        isNewMatch = true;
        renderMessagePrompt();
      } else {
        isNewMatch = false;
        socket.emit("open chat", roomId);
      }
    });
  }

  newmachtChatLinks.forEach(chat => {
    addChatListeners(chat, true);
  });
  chatLinks.forEach(chat => {
    addChatListeners(chat, false);
  });

  backButton.addEventListener("click", e => {
    e.preventDefault();
    if (isNewMatch == "reload") {
      location.reload();
    }
    socket.emit("leave room", roomId);
    chatArea.classList.toggle("down");
  });

  unMatchHeart.addEventListener("click", e => {
    e.preventDefault();
    unmatchQuestion.classList.toggle("hidden");
  });

  profileButton.addEventListener("click", e =>{
    e.preventDefault();
    profilesPopup.classList.toggle('hidden');
  })
  
  function swapChatLists(){
    profilesPopup.classList.toggle('hidden');
    containersForallMatches.forEach(container =>{
        container.classList.toggle('slide');
    })
  }

  function swapUser(){
    if(isUserABoy){
      isUserABoy = false;
      userName = "Charlie";
      profileImg.src = 'https://i.redd.it/i3qlw1aid7g21.jpg';
      socket.emit("swap user", userName);
    }else{
      isUserABoy = true;
      userName = "Janno";
      profileImg.src = 'https://avatars1.githubusercontent.com/u/11157347?s=460&v=4';
      socket.emit("swap user", userName);
    }
   swapChatLists(); 
  }

  yesUnmatch.addEventListener("click", e => {
    e.preventDefault();
    chatLinks.forEach(chatLink => {
      if (chatLink.dataset.room == roomId) {
        chatLink.remove();
      }
    });
    unmatchQuestion.classList.toggle("hidden");
    chatArea.classList.toggle("down");
    unmatchPopup.classList.toggle("hidden");
    setTimeout(() => {
      unmatchPopup.classList.toggle("hidden");
    }, 2000);
    unmatchPerson.textContent = talkingTo;
    socket.emit("unmatch", roomId);
  });
  dontUnmatch.addEventListener("click", e => {
    e.preventDefault();
    unmatchQuestion.classList.toggle("hidden");
  });

  socket.on("open chat", function(data) {
    chatWindow.innerHTML = "";
    data.forEach(messageObject => {
      const messageToRender = buildAMessage(
        messageObject.from,
        messageObject.msg,
        messageObject.time
      );
      chatWindow.insertAdjacentHTML("beforeend", messageToRender);
    });
    scrollToEnd();
  });

  socket.on("chat message", function(data) {
    if (isNewMatch) {
      chatWindow.innerHTML = "";
    }
    const messageToRender = buildAMessage(data.from, data.msg, data.time);
    chatWindow.insertAdjacentHTML("beforeend", messageToRender);
    scrollToEnd();
    updateLastMessages(data.msg, data.room);
  });

  sendButton.addEventListener("click", function(e) {
    e.preventDefault();
    sendMessage();
  });

  inputField.addEventListener("keydown", function(e) {
    if (e.key == "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });

  function sendMessage() {
    const message = inputField.value;
    if (message.length < 1) {
      clearInputfieldAndFocus();
      return;
    }

    const timestamp = getCurrentTime();
    if (isNewMatch) {
      isNewMatch = "reload";
      socket.emit("make new chat", {
        sender: userName,
        msg: message,
        time: timestamp,
        room: roomId
      });
    } else {
      socket.emit("chat message", {
        sender: userName,
        msg: message,
        time: timestamp,
        room: roomId
      });
    }
    clearInputfieldAndFocus();
  }

  window.onload =  function(){
    if(profileButton.dataset.user == "Janno"){
      usernameField.value = "Charlie"
      profile.textContent = "Charlie"
    }else{
      swapUser();
      usernameField.value = "Janno"
      profile.textContent = "Janno"
    }
    usernameField.innerHTML = "idot";
  }

})();
}