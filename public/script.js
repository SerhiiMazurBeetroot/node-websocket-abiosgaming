document.addEventListener("DOMContentLoaded", function() {
  let client
  let connecting = false
  let backoff = 250
  let username
  let password
  const pingInterval = 30 * 1000
  const messageInput = document.querySelector('.message_input')
  const errorMessageSpan = document.querySelector("#errorMessage")
  const usernameInput = document.querySelector('#username')
  const passwordInput = document.querySelector('#password')
  const timestamp = () => new Date().toISOString().replace('T', ' ').substr(0, 19)

  function heartbeat() {
    if (!client) return
    if (client.readyState !== 1) return
    sendMessage(getMessageText('ping'))
    setTimeout(heartbeat, pingInterval)
  }

  const getJwtAuth = () => {
    fetch(`http://localhost:5000/auth?username=${username}&password=${password}`)
    .then(response => response.text())
    .then((response) => {
      if (response.includes("Error")) {
        errorMessageSpan.innerHTML = response
      } else {
        errorMessageSpan.innerHTML = ""
        openWsConnection(response)
      }
    })
    .catch(err => console.log(err))
  }

  // Open the WebSocket connection using the JWT.
  const openWsConnection = (jwtAuth) => {
    let url = `ws://${location.host}/ws?token=${jwtAuth}`

    client = new WebSocket(url)

    client.onopen = () => {
      connecting = false;
      document.querySelector(".chat_window").classList.add('active')
      document.querySelector(".loginForm").classList.remove('active')
      document.querySelector('.bottom_wrapper').classList.add('active')
      sendMessage(`${timestamp()}, WebSocket :: connecting.`, 'left')
    }

    client.onmessage = (e) => {
      e.data.includes('ping') ? '' : sendMessage(e.data, 'right')
    }

    client.onerror = (e) => {
      console.log("WebSocket error received: ", e)
    }

    client.onclose = (e) => {
      console.error(timestamp(), 'WebSocket :: closed')

      if (e.code !== 1000) {
        if (connecting === false) { // abnormal closure
          backoff = backoff === 8000 ? 250 : backoff * 2
          setTimeout(() => getJwtAuth(), backoff)
          connecting = true
        }
      } else {
        console.error(e)
      }
    }
  }

  // Message
  function sendMessage (text, messageSide) {
    if (!text) return
    if (text.trim() === '') return
    messageSide = messageSide || 'left'

    let message = new Message({
      text: text,
      messageSide: messageSide
    });
  }

  let Message = function (arg) {
    const {text, messageSide} = arg
    let messageTemplate = document.querySelector('.message_template .message').cloneNode( true )
    messageTemplate.setAttribute( 'class', 'message ' + messageSide + ' appeared' )
    messageTemplate.querySelector('.text').innerHTML = text
    document.querySelector('.messages').appendChild( messageTemplate )
    document.querySelector(".messages li:last-child").scrollIntoView()
  }

  function getMessageText (message = messageInput.value) {
    if(message !== '') {
      client.send(message)
      return message
    }
  }

  function valifateForm(e) {
    if( e.key === 'Enter' || e.type === 'click' ) {
      username = usernameInput.value
      password = passwordInput.value
  
      if(username === '' && password === '') {
        errorMessageSpan.innerHTML = 'Please fill in the login and password'
      } else if(username === '' && password !== '') {
        errorMessageSpan.innerHTML = 'Please fill in the login'
      } else if(username !== '' && password === '') {
        errorMessageSpan.innerHTML = 'Please fill in the password'
      } else if(username !== '' && password !== '') {
        getJwtAuth()
      }
    } else {
      errorMessageSpan.innerHTML = ''
    }
  }

  // Listeners
  document.querySelector('.send_message').addEventListener('click', () =>  {
    sendMessage(getMessageText())
    messageInput.value = ''
  })

  messageInput.addEventListener('keyup', (e) => {
    if(e.key === 'Enter') {
      sendMessage(getMessageText())
      messageInput.value = ''
    } 
  })
  document.querySelector(".button.close").addEventListener('click', () => {
    document.querySelectorAll('.messages .message').forEach(element => element.remove() )
  })

  document.querySelector('#btn_login').addEventListener('click', (e) => valifateForm(e) )
  usernameInput.addEventListener('keyup', (e) => valifateForm(e) )
  passwordInput.addEventListener('keyup', (e) => valifateForm(e) );

  setTimeout(heartbeat, pingInterval);
})
