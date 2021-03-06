const socket = io('https://slam-game.herokuapp.com/', { transports : ['websocket'] })

const lobby = document.getElementById("lobby")
const lobbyInput = document.getElementById("lobbyInput")
const lobbySelect = document.getElementById("lobbySelect")
const readyButton = document.getElementById("readyButton")
const readyCounter = document.getElementById("readyCounter")
const infoPopup = document.getElementById("info")
const handPopup = document.getElementById("hand")
const modeSwitch = document.getElementById("modeSelect")
modeSwitch.onchange = () => { socket.emit("newMode", myLobby, modeSwitch.checked) }

let gameLetters = []
for (let i = 0; i < 4; i++) {
  gameLetters.push(document.getElementById("c" + i.toString()))
}
let myLetters = []
for (let i = 0; i < 4; i++) {
  myLetters.push(document.getElementById("ci" + i.toString()))
}

let wordList = []
let wordListTotal = []
let word = "SLAM"
let deck = []
let hand = []
let myLobby = ""
let imReady = false
let ready = 0
let players = 1
let pnum = 0
let selected = -1
let index = 0
let finished = 0
let started = false


socket.on('newMode', (bool) => {
  if (!started) { modeSwitch.checked = bool }
  console.log(modeSwitch.checked)
})

function setLobby() {
  lobby.innerText = myLobby
  socket.emit("checkPop", myLobby)
}

function initLobby(keep = false) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  if (!keep) {
    socket.emit('leaveLobby', myLobby)
    myLobby = result
    socket.emit('joinLobby', myLobby)
  }
  setLobby()
}

lobbySelect.addEventListener('click', () => {
  socket.emit('leaveLobby', myLobby)
  socket.emit('joinLobby', lobbyInput.value)
  myLobby = lobbyInput.value
  setLobby()
})

function setReadyCounter() {
  readyCounter.innerText = ready.toString() + "/" + players.toString()
}

readyButton.addEventListener('click', () => {
  if (imReady) {
    imReady = false
    readyButton.innerText = "Ready Up"
    socket.emit('readyDown', myLobby)
    setReadyCounter()
  }
  else {
    imReady = true
    pnum = ready
    readyButton.innerText = 'Unready'
    socket.emit('readyUp', myLobby)
    socket.emit("deck", myLobby, deck)
    setReadyCounter()
  }
})

socket.on('deck', (array, text) => {
  deck = array
})

function initDeck() {
  deck = []
  const cards = "ES OB EK TL TF ZK GA YT PU RT HR MO JS FR BU HT WS AA WP NH EL FM IM AH SD CB OK MC IP KC LO PR EJ NS VM PD AT OS AN YD OV FN ZC ET BF ME FR EP IL DG ER AL"
  for (let i = 0; i < 52; i++) {
    deck.push(cards.substring(3 * i, 3 * i + 2))
  }
  deck.push("??", "??", "??")
  let shuffled = deck
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)
  deck = shuffled
}

function initWord() {
  for (let i = 0; i < word.length; i++) {
    gameLetters[i].innerText = word.charAt(i)
  }
}

function reset(keep=false) {
  started = false
  finished = 0
  index = 0
  infoPopup.innerText = `Join a lobby by typing something in the lobby textbox and clicking join
                        When the game starts, a random word will appear in the center
                        You will be dealt cards with two letters on them, use either one during gameplay 
                        You can play a card on top of any letter in the current word to make a new word
                        To play a card, select it, type the word you want to play, and hit enter!
                        Turn the switch on to enable easy mode, where words can be played more than once`
  for (let i = 0; i < 4; i++) {
    myLetters[i].style.backgroundColor = "grey"
    myLetters[i].innerText = ""
  }
  wordList = wordListTotal.slice(0)
  initLobby(keep)
  initWord()
  initDeck()
}

socket.on('wordList', (array) => {
  wordList = array
  wordListTotal = wordList.slice(0)
  myLobby = socket.id
  reset()
})

socket.on('setPop', (population) => {
  if (!started) {
    players = population
    ready = 0
    imReady = false
    if (!started) { modeSwitch.checked = false }
    readyButton.innerText = "Ready Up"
    readyButton.disabled = false
    lobbySelect.disabled = false
    modeSwitch.disabled = false
    setReadyCounter()
  }
})

socket.on('readyUp', () => {
  if (!started) {
    ready = ready + 1
    setReadyCounter()
    if (ready === players) { startGame() }
  }
})

socket.on('readyDown', () => {
  if (!started) {
    ready = ready - 1
    setReadyCounter()
  }
})

function startGame() {
  started = true
  readyButton.disabled = true
  lobbySelect.disabled = true
  modeSwitch.disabled = true
  infoPopup.innerText = "All players are ready, starting the game"
  setTimeout(() => {
    setStart()
    infoPopup.innerText = "Starting word chosen"
    setTimeout(() => {
      dealCards()
      showHand()
      infoPopup.innerText = "Cards Dealt"
      setTimeout(() => {
        infoPopup.innerText = "Game starting in 3..."
        setTimeout(() => {
          infoPopup.innerText = "Game starting in 2..."
          setTimeout(() => {
            infoPopup.innerText = "Game starting in 1..."
            setTimeout(() => {
              infoPopup.innerText = "Go!"
              playGame()
            }, 1000)
          }, 1000)
        }, 1000)
      }, 2000)
    }, 2000)
  }, 2000)
}

function setStart() {
  word = wordList[Math.floor(Math.random() * wordList.length)].toUpperCase().substring(0, 4)
  socket.emit("choose", myLobby, word)
}

socket.on('choose', (text) => {
  word = text
  initWord()
})

function dealCards() {
  hand = []
  for (let i = 0; i < deck.length; i++) {
    if (i % players === pnum) {
      hand.push(deck[i])
    }
  }
}

function showHand() {
  let cellWidth = Math.floor(window.innerWidth / (Math.ceil(hand.length) / 2 + 4))
  let cellHeight = Math.floor(window.innerHeight * 0.1)
  let cols = ""
  for (let i = 0; i < Math.ceil(hand.length / 2); i++) {
    cols = cols + cellWidth.toString() + "px "
  }
  handPopup.style.gridTemplateColumns = cols
  while (handPopup.firstChild) {
    handPopup.removeChild(handPopup.lastChild);
  }
  for (let i = 0; i < hand.length; i++) {
    let nextCard = createCard(i.toString(), cellWidth, cellHeight)
    handPopup.appendChild(nextCard)
  }
}

function createCard(num, width, height) {
  const nextCard = document.createElement('div')
  nextCard.classList.add("card")
  nextCard.setAttribute('id', 'card' + num)
  nextCard.style.width = (width - 2).toString() + "px"
  nextCard.style.height = (height - 2).toString() + "px"

  const miniChar = document.createElement('div')
  miniChar.classList.add("mini")
  miniChar.innerText = hand[num][0] !== '?' ? hand[num][0] : ''
  nextCard.appendChild(miniChar)

  const bigChar = document.createElement('div')
  bigChar.classList.add("big")
  bigChar.innerText = hand[num][1]
  nextCard.appendChild(bigChar)
  return nextCard
}

function checkWord(cWord) {
  let valid = wordList.includes(cWord)
  if (valid) {
    word = cWord
  }
  return valid
}

function playGame() {
  setTimeout(() => {
    infoPopup.innerText = ''
  }, 1000)
  for (let i = 0; i < hand.length; i++) {
    const card = document.getElementById("card" + i.toString())
    card.onclick = () => {
      if (selected !== -1) {
        const lastCard = document.getElementById("card" + selected.toString())
        lastCard.style.backgroundColor = "aliceblue"
      }
      card.style.backgroundColor = "lightgrey"
      selected = i
    }
  }
  for (let i = 0; i < 4; i++) {
    myLetters[i].style.backgroundColor = "aliceblue"
    myLetters[i].innerText = "_"
  }
  document.onkeydown = (e) => {
    e.preventDefault()
    const characters = 'abcdefghijklmnopqrstuvwxyz'
    if (e.key === "Backspace") {
      if (index > 0) {
        index = index - 1
        myLetters[index].innerText = "_"
      }
      else if (index === 0) {
        myLetters[0].innerText = "_"
      }
    }
    else if (e.key === "Enter" && selected === -1) {
      infoPopup.innerText = 'No card selected!'
      setTimeout(() => { if (infoPopup.innerText === 'No card selected!') { infoPopup.innerText = '' } }, 1000)
    }
    else if (e.key === "Enter" && selected !== -1 && index === 4) {
      let myWord = ""
      let same = 0
      let swapped = 0
      for (let i = 0; i < 4; i++) {
        if (myLetters[i].innerText === word[i]) {
          same = same + 1
        }
        else if (hand[selected].includes(myLetters[i].innerText) || hand[selected] === "??") {
          swapped = swapped + 1
        }
        myWord = myWord + myLetters[i].innerText
      }
      //alert("same: " + same.toString() + ", swapped: " + swapped.toString() + myWord + ": " + checkWord(myWord).toString())
      const oldWord = word.substring(0)
      if (same === 3 && swapped === 1 && checkWord(myWord)) {
        const card = document.getElementById("card" + selected.toString())
        while (card.firstChild) {
          card.removeChild(card.lastChild);
        }
        card.style.backgroundColor = "grey"
        card.onclick = () => { }
        selected = -1
        finished = finished + 1
        index = 0
        for (let i = 0; i < 4; i++) {
          myLetters[i].style.backgroundColor = "aliceblue"
          myLetters[i].innerText = "_"
        }
        if (!modeSwitch.checked) {
          socket.emit('newWordHard', myLobby, word, oldWord, pnum, hand)
        }
        else {
          socket.emit('newWord', myLobby, word, pnum, hand)
        }
      }
      else {
        index = 0
        for (let i = 0; i < 4; i++) {
          myLetters[i].style.backgroundColor = "aliceblue"
          myLetters[i].innerText = "_"
        }
      }
    }
    else if (e.key === "Enter" && selected === -1) {
      index = 0
      for (let i = 0; i < 4; i++) {
        myLetters[i].style.backgroundColor = "aliceblue"
        myLetters[i].innerText = "_"
      }
    }
    else if (characters.includes(e.key)) {
      if (index < 4) {
        myLetters[index].innerText = e.key.toUpperCase()
        index = index + 1
      }
    }
  }
}

socket.on('newWord', (newWord) => {
  word = newWord
  if (finished === hand.length) {
    socket.emit('win', myLobby)
  }
  else if (stalemate()) {

  }
  initWord()
})

socket.on('newWordHard', (newWord, oldWord) => {
  word = newWord
  wordList.splice(wordList.indexOf(oldWord), 1)
  if (finished === hand.length) {
    socket.emit('win', myLobby)
  }
  else if (stalemate()) {

  }
  initWord()
})

function stalemate() {

}

function end() {
  if (finished === hand.length) { infoPopup.innerText = 'You Win!' }
  else { infoPopup.innerText = 'You Lose!' }
  document.onkeydown = () => { }
  while (handPopup.firstChild) {
    handPopup.removeChild(handPopup.lastChild);
  }
  setTimeout(() => { reset(true) }, 2000)
}

socket.on('lose', () => { end() })