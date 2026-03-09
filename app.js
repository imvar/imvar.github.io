(function() {
  var KEYWORD_REPLIES = {
    "привет": ["Привет!", "Здравствуй!", "Привет, чем могу помочь?"],
    "здравствуй": ["Здравствуй!", "Привет!", "Добрый день!"],
    "учёба": ["Учёба в ВШЭ — это здорово.", "Как дела с учёбой?", "Учёба требует усилий, но оно того стоит."],
    "вшэ": ["ВШЭ — отличный выбор!", "Я тоже учусь в ВШЭ.", "Высшая школа экономики — один из лучших вузов."],
    "миэм": ["МИЭМ — сильный факультет.", "Прикладная математика? Круто!", "МИЭМ даёт хорошую базу."],
    "экзамен": ["Удачи на экзамене!", "Экзамены — это временно.", "Готовься заранее — и всё получится."],
    "проект": ["Над каким проектом работаешь?", "Проекты в ВШЭ бывают интересные.", "Удачи с проектом!"],
    "помощь": ["Чем могу помочь?", "Опиши, что нужно.", "Постараюсь подсказать."],
    "спасибо": ["Пожалуйста!", "Не за что!", "Рад был помочь."],
    "пока": ["Пока!", "До встречи!", "Удачи!"]
  };

  var VOICE_REPLIES = [
    "Интересно!",
    "Понял тебя.",
    "Спасибо за голосовое!",
    "Услышал.",
    "Записал."
  ];

  function initMap() {
    if (typeof L === "undefined") return;
    var mapEl = document.getElementById("map");
    if (!mapEl) return;
    var center = [55.76135, 37.6335];
    var map = L.map("map").setView(center, 16);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>"
    }).addTo(map);
    L.marker(center).addTo(map).bindPopup("НИУ ВШЭ, ул. Мясницкая, 20");
  }

  function pickReply(text) {
    var lower = text.toLowerCase().trim();
    var found = [];
    for (var key in KEYWORD_REPLIES) {
      if (KEYWORD_REPLIES.hasOwnProperty(key) && lower.indexOf(key) !== -1) {
        found = found.concat(KEYWORD_REPLIES[key]);
      }
    }
    if (found.length === 0) return null;
    return found[Math.floor(Math.random() * found.length)];
  }

  function addMessage(container, isUser, content) {
    var wrap = document.createElement("div");
    wrap.className = "chat-msg " + (isUser ? "chat-msg-user" : "chat-msg-bot");
    var body = document.createElement("div");
    body.className = "chat-msg-body";
    if (typeof content === "string") {
      body.textContent = content;
    } else if (content && content.nodeType === 1) {
      body.appendChild(content);
    }
    wrap.appendChild(body);
    container.appendChild(wrap);
    container.scrollTop = container.scrollHeight;
  }

  function sendTextMessage() {
    var input = document.getElementById("chat-input");
    var messages = document.getElementById("chat-messages");
    if (!input || !messages) return;
    var text = input.value.trim();
    if (!text) return;
    addMessage(messages, true, text);
    input.value = "";
    var reply = pickReply(text);
    if (reply) {
      setTimeout(function() {
        addMessage(messages, false, reply);
      }, 400 + Math.random() * 400);
    }
  }

  function addVoiceMessage(blob) {
    var messages = document.getElementById("chat-messages");
    if (!messages) return;
    var url = URL.createObjectURL(blob);
    var audio = document.createElement("audio");
    audio.controls = true;
    audio.src = url;
    var wrap = document.createElement("div");
    wrap.className = "chat-voice-wrap";
    wrap.appendChild(audio);
    addMessage(messages, true, wrap);
    var reply = VOICE_REPLIES[Math.floor(Math.random() * VOICE_REPLIES.length)];
    setTimeout(function() {
      addMessage(messages, false, reply);
    }, 500);
  }

  function setupVoice() {
    var btn = document.getElementById("chat-voice");
    if (!btn) return;
    var mediaRecorder = null;
    var chunks = [];

    function startRecord() {
      chunks = [];
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
        try {
          mediaRecorder = new MediaRecorder(stream);
          mediaRecorder.ondataavailable = function(e) {
            if (e.data.size > 0) chunks.push(e.data);
          };
          mediaRecorder.onstop = function() {
            stream.getTracks().forEach(function(t) { t.stop(); });
            if (chunks.length > 0) {
              var blob = new Blob(chunks, { type: "audio/webm" });
              addVoiceMessage(blob);
            }
          };
          mediaRecorder.start();
        } catch (err) {}
      }).catch(function() {});
    }

    function stopRecord() {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }
    }

    btn.addEventListener("mousedown", function() { startRecord(); });
    btn.addEventListener("mouseup", stopRecord);
    btn.addEventListener("mouseleave", stopRecord);
    btn.addEventListener("touchstart", function(e) { e.preventDefault(); startRecord(); }, { passive: false });
    btn.addEventListener("touchend", function(e) { e.preventDefault(); stopRecord(); }, { passive: false });
  }

  function setupChat() {
    var sendBtn = document.getElementById("chat-send");
    var input = document.getElementById("chat-input");
    if (sendBtn) {
      sendBtn.addEventListener("click", sendTextMessage);
    }
    if (input) {
      input.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
          e.preventDefault();
          sendTextMessage();
        }
      });
    }
    setupVoice();
  }

  window.onload = function() {
    initMap();
    setupChat();
  };
})();
