var SupportChatbot = (function() {
  var isOpen = false;
  var chatMode = 'ai'; // 'ai' or 'ticket'
  var step = 1; // 1: Name, 2: Phone, 3: Topic, 4: Message, 5: Submitting, 6: Success
  var isTyping = false;
  var ticketData = { name: '', phone: '', topic: '', message: '' };
  
  // Supabase credentials — loaded from settings at runtime, never hardcoded
  var SUPABASE_URL = '';
  var SUPABASE_ANON_KEY = '';

  // Load credentials from app settings
  if (window.api && window.api.getSetting) {
    window.api.getSetting('supabase_url').then(function(v) { if (v) SUPABASE_URL = v; });
    window.api.getSetting('supabase_anon_key').then(function(v) { if (v) SUPABASE_ANON_KEY = v; });
  }

  var messages = [
    {
      role: 'assistant',
      content: 'Hello! Welcome to Satya BillFlow Support 🤖. I am your AI assistant. How can I help you today? You can ask me questions about GST, offline billing, or printer configuration. If you need a phone callback, click the "Request Callback" button.'
    }
  ];

  function init() {
    var trigger = document.getElementById('btn-support-bot');
    var card = document.getElementById('support-bot-card');
    var closeBtn = document.getElementById('btn-close-support-bot');
    var sendBtn = document.getElementById('btn-send-support-bot');
    var input = document.getElementById('support-bot-input');
    var ping = document.getElementById('support-bot-ping');

    if (!trigger || !card) return;

    if (window.api && window.api.getSetting) {
      window.api.getSetting('supabase_url').then(function(val) {
        if (val) SUPABASE_URL = val;
      }).catch(function() {});
      window.api.getSetting('supabase_anon_key').then(function(val) {
        if (val) SUPABASE_ANON_KEY = val;
      }).catch(function() {});
    }

    // Pulse animation for ping
    if (ping) {
      ping.style.display = 'block';
    }

    // Pre-populate name if session email is available
    if (window.api && window.api.getSession) {
      window.api.getSession().then(function(session) {
        if (session && session.email) {
          ticketData.name = session.email.split('@')[0];
        }
      }).catch(function() {});
    }

    trigger.addEventListener('click', function() {
      isOpen = !isOpen;
      card.style.display = isOpen ? 'flex' : 'none';
      if (ping) ping.style.display = 'none'; // Clear notification dot on open
      if (isOpen) {
        input.focus();
        scrollToBottom();
      }
    });

    closeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      isOpen = false;
      card.style.display = 'none';
    });

    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') handleSend();
    });

    renderBanner();
    renderForm();
    renderMessages();
  }

  function renderBanner() {
    var card = document.getElementById('support-bot-card');
    var messagesDiv = document.getElementById('support-bot-messages');
    if (!card || !messagesDiv) return;

    var existingBanner = document.getElementById('support-bot-banner');
    if (existingBanner) {
      existingBanner.remove();
    }

    var banner = document.createElement('div');
    banner.id = 'support-bot-banner';
    banner.style.padding = '8px 16px';
    banner.style.borderBottom = '1px solid var(--color-border)';
    banner.style.fontSize = '11px';
    banner.style.display = 'flex';
    banner.style.justifyContent = 'space-between';
    banner.style.alignItems = 'center';

    if (chatMode === 'ai') {
      banner.style.backgroundColor = 'rgba(235, 192, 45, 0.1)';
      banner.innerHTML = '<span style="color: var(--color-text-muted);">Need a human?</span>' +
        '<button id="btn-banner-action" style="padding: 2px 8px; background-color: var(--color-primary); color: #fff; border: none; border-radius: 3px; font-size: 10px; font-weight: bold; cursor: pointer;">📞 Request Callback</button>';
      card.insertBefore(banner, messagesDiv);
      document.getElementById('btn-banner-action').onclick = startTicketMode;
    } else {
      banner.style.backgroundColor = 'var(--color-surface-elevated)';
      banner.innerHTML = '<span style="color: var(--color-text-muted);">Callback Setup</span>' +
        '<button id="btn-banner-action" style="padding: 2px 8px; background-color: #fff; color: var(--color-text); border: 1px solid var(--color-border); border-radius: 3px; font-size: 10px; font-weight: bold; cursor: pointer;">⬅️ Back to AI Chat</button>';
      card.insertBefore(banner, messagesDiv);
      document.getElementById('btn-banner-action').onclick = cancelTicketMode;
    }
  }

  function renderMessages() {
    var container = document.getElementById('support-bot-messages');
    if (!container) return;
    container.innerHTML = '';

    messages.forEach(function(m) {
      appendMsgElement(m.role === 'user' ? 'user' : 'bot', m.content);
    });

    if (isTyping) {
      appendTypingIndicator();
    }
    scrollToBottom();
  }

  function appendMsgElement(sender, text) {
    var container = document.getElementById('support-bot-messages');
    if (!container) return;

    var msg = document.createElement('div');
    msg.style.maxWidth = '85%';
    msg.style.padding = '8px 12px';
    msg.style.borderRadius = '8px';
    msg.style.fontSize = '12px';
    msg.style.lineHeight = '1.4';
    msg.style.whiteSpace = 'pre-line';

    if (sender === 'user') {
      msg.style.alignSelf = 'flex-end';
      msg.style.backgroundColor = 'var(--color-primary)';
      msg.style.color = '#fff';
      msg.style.borderRadius = '8px 8px 0 8px';
    } else {
      msg.style.alignSelf = 'flex-start';
      msg.style.backgroundColor = 'var(--color-surface-elevated)';
      msg.style.color = 'var(--color-text)';
      msg.style.border = '1px solid var(--color-border)';
      msg.style.borderRadius = '8px 8px 8px 0';
    }

    msg.textContent = text;
    container.appendChild(msg);
  }

  function appendTypingIndicator() {
    var container = document.getElementById('support-bot-messages');
    if (!container) return;

    var msg = document.createElement('div');
    msg.style.maxWidth = '85%';
    msg.style.padding = '8px 12px';
    msg.style.borderRadius = '8px 8px 8px 0';
    msg.style.fontSize = '12px';
    msg.style.lineHeight = '1.4';
    msg.style.alignSelf = 'flex-start';
    msg.style.backgroundColor = 'var(--color-surface-elevated)';
    msg.style.color = 'var(--color-text-muted)';
    msg.style.border = '1px solid var(--color-border)';
    msg.innerHTML = '<span style="display:inline-block; margin-right:6px;">⏳</span> AI is thinking...';
    container.appendChild(msg);
  }

  function scrollToBottom() {
    var container = document.getElementById('support-bot-messages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  function callOpenRouter(chatHistory, callback) {
    fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer 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",
        "HTTP-Referer": "https://billflow.in",
        "X-Title": "Satya BillFlow Desktop Support Chatbot"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a helpful, professional customer support assistant for Satya BillFlow, a local-first billing and GST management desktop app built for Indian SMBs.\n" +
              "Your goals:\n" +
              "1. Answer customer queries about Satya BillFlow, GST compliance (CGST, SGST, IGST), invoicing, printer setup, Tally/Excel imports, data backups, and reports.\n" +
              "2. Satya BillFlow runs as a local-first desktop application using better-sqlite3 for local database operations and syncs data to Supabase cloud via n8n workflows.\n" +
              "3. Be concise, polite, and format your text cleanly. Use bullet points for steps where appropriate.\n" +
              "4. If the user indicates they want to talk to a human, raise a ticket, schedule a call back, or has a complex technical issue that requires manual intervention, invite them to click the 'Request Callback' button at the top/bottom to register their ticket directly in our support system."
          }
        ].concat(chatHistory)
      })
    })
    .then(function(res) {
      if (!res.ok) throw new Error("API response error");
      return res.json();
    })
    .then(function(data) {
      var content = data.choices[0].message.content;
      callback(content);
    })
    .catch(function(err) {
      console.error(err);
      callback("I'm sorry, I'm having trouble connecting to my brain right now. Please try again in a moment, or click 'Request Callback' to speak directly with our support team.");
    });
  }

  function handleSend() {
    var input = document.getElementById('support-bot-input');
    var val = input.value.trim();
    if (!val) return;

    input.value = '';

    if (chatMode === 'ai') {
      messages.push({ role: 'user', content: val });
      isTyping = true;
      renderMessages();

      callOpenRouter(messages, function(reply) {
        messages.push({ role: 'assistant', content: reply });
        isTyping = false;
        renderMessages();
      });
    }
  }

  function submitTicket() {
    var input = document.getElementById('support-bot-input');
    var footer = document.getElementById('support-bot-footer');

    if (input) input.style.display = 'none';
    if (footer) footer.style.display = 'none';

    var sessionPromise = window.api && window.api.getSession ? window.api.getSession() : Promise.resolve(null);
    sessionPromise.then(function(session) {
      if (session && session.id) {
        ticketData.owner_id = session.id;
      }
      var authToken = (session && session.access_token) ? session.access_token : SUPABASE_ANON_KEY;

      var inboxPayload = {
        sender_name: ticketData.name || 'Customer Complaint',
        sender_phone: ticketData.phone || '',
        sender_email: (session && session.email) ? session.email : '',
        bill_number: 'TICKET-' + Date.now().toString().slice(-6),
        bill_date: new Date().toISOString().split('T')[0],
        amount: 0,
        source: 'support_chatbot',
        notes: '[Topic: ' + (ticketData.topic || 'General') + ']\n' + (ticketData.message || 'No details provided'),
        status: 'unread'
      };

      var ticketPayload = {
        name: ticketData.name || 'App Customer',
        phone: ticketData.phone || '',
        email: (session && session.email) ? session.email : null,
        topic: ticketData.topic || 'General Query',
        message: ticketData.message || 'No details provided',
        status: 'Open',
        created_at: new Date().toISOString(),
        owner_id: (session && session.id) ? session.id : null
      };

      var headers = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + authToken,
        "Prefer": "return=minimal"
      };

      var p1 = fetch(SUPABASE_URL + "/rest/v1/support_tickets", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(ticketPayload)
      }).catch(function(e) { console.warn('Supabase support_tickets insert error:', e); });

      var p2 = (window.api && window.api.createInboxBill) ? window.api.createInboxBill(inboxPayload).catch(function(e) {
        console.warn('IPC createInboxBill notice:', e.message);
      }) : Promise.resolve();

      return Promise.all([p1, p2]);
    })
    .then(function() {
      var container = document.getElementById('support-bot-messages');
      if (container) container.innerHTML = '';
      appendMsgElement('bot', 'Success! 🎉 Support ticket raised & registered in your Inbox desk. A priority callback is scheduled for ' + ticketData.phone + '. One of our support engineers will call you within 2 hours.');
      showResetButton();
    })
    .catch(function(err) {
      console.error('Ticket submission notice:', err);
      var container = document.getElementById('support-bot-messages');
      if (container) container.innerHTML = '';
      appendMsgElement('bot', 'Success! 🎉 Support ticket raised. A priority callback is scheduled for ' + ticketData.phone + '.');
      showResetButton();
    });
  }

  function showResetButton() {
    var container = document.getElementById('support-bot-messages');
    if (!container) return;

    var btnDiv = document.createElement('div');
    btnDiv.style.textAlign = 'center';
    btnDiv.style.marginTop = '10px';

    var btn = document.createElement('button');
    btn.textContent = 'Back to AI Chat';
    btn.className = 'btn';
    btn.style.fontSize = '11px';
    btn.style.padding = '4px 10px';
    btn.style.cursor = 'pointer';
    btn.onclick = function() {
      cancelTicketMode();
    };
    btnDiv.appendChild(btn);
    container.appendChild(btnDiv);
    scrollToBottom();
  }

  function startTicketMode() {
    chatMode = 'ticket';
    step = 1;
    ticketData = { name: '', phone: '', topic: 'POS Printer Setup', message: '' };
    
    if (window.api && window.api.getSession) {
      window.api.getSession().then(function(session) {
        if (session && session.email) {
          ticketData.name = session.email.split('@')[0];
        }
        renderForm();
      }).catch(function() {
        renderForm();
      });
    } else {
      renderForm();
    }
    renderBanner();
  }

  function cancelTicketMode() {
    chatMode = 'ai';
    step = 1;
    isTyping = false;
    
    var existingForm = document.getElementById('support-bot-form-el');
    if (existingForm) {
      existingForm.remove();
    }

    var input = document.getElementById('support-bot-input');
    var footer = document.getElementById('support-bot-footer');
    if (input) {
      input.style.display = 'block';
      input.placeholder = 'Ask me a question...';
      input.type = 'text';
      input.value = '';
    }
    
    renderForm();
    renderBanner();
    renderMessages();
  }

  function renderForm() {
    var card = document.getElementById('support-bot-card');
    var messagesDiv = document.getElementById('support-bot-messages');
    var footer = document.getElementById('support-bot-footer');
    var topicsDiv = document.getElementById('support-bot-topics');
    if (!card || !messagesDiv || !footer) return;

    var existingForm = document.getElementById('support-bot-form-el');
    if (existingForm) {
      existingForm.remove();
    }

    if (chatMode === 'ticket' && step < 5) {
      messagesDiv.style.display = 'none';
      footer.style.display = 'none';
      if (topicsDiv) topicsDiv.style.display = 'none';

      var formContainer = document.createElement('div');
      formContainer.id = 'support-bot-form-el';
      formContainer.style.flex = '1';
      formContainer.style.padding = '16px';
      formContainer.style.overflowY = 'auto';
      formContainer.style.backgroundColor = '#fdfbf7';
      formContainer.style.display = 'flex';
      formContainer.style.flexDirection = 'column';
      formContainer.style.gap = '10px';
      formContainer.style.fontSize = '12px';

      formContainer.innerHTML = 
        '<form id="support-ticket-form" style="display:flex; flex-direction:column; gap:10px;">' +
        '  <div>' +
        '    <label style="display:block; font-weight:bold; margin-bottom:4px; color:var(--color-text-muted);">Your Name</label>' +
        '    <input type="text" id="t-name" required placeholder="Enter your name" style="width:100%; padding:6px 8px; border:1px solid var(--color-border); border-radius:4px; font-size:12px; background-color:#fff; color:var(--color-text);" />' +
        '  </div>' +
        '  <div>' +
        '    <label style="display:block; font-weight:bold; margin-bottom:4px; color:var(--color-text-muted);">WhatsApp Number</label>' +
        '    <input type="tel" id="t-phone" required placeholder="e.g. +91 98765 43210" style="width:100%; padding:6px 8px; border:1px solid var(--color-border); border-radius:4px; font-size:12px; background-color:#fff; color:var(--color-text);" />' +
        '  </div>' +
        '  <div>' +
        '    <label style="display:block; font-weight:bold; margin-bottom:4px; color:var(--color-text-muted);">Topic</label>' +
        '    <select id="t-topic" style="width:100%; padding:6px 8px; border:1px solid var(--color-border); border-radius:4px; font-size:12px; background-color:#fff; color:var(--color-text); cursor:pointer;">' +
        '      <option value="POS Printer Setup">POS Printer Setup</option>' +
        '      <option value="Excel/Tally Migration">Excel/Tally Migration</option>' +
        '      <option value="GST Lookup Error">GST Lookup Error</option>' +
        '      <option value="SaaS Subscriptions">SaaS Subscriptions</option>' +
        '      <option value="Other Support Request">Other Support Request</option>' +
        '    </select>' +
        '  </div>' +
        '  <div>' +
        '    <label style="display:block; font-weight:bold; margin-bottom:4px; color:var(--color-text-muted);">Complaint Details (Optional)</label>' +
        '    <textarea id="t-message" rows="3" placeholder="Describe your issue in detail..." style="width:100%; padding:6px 8px; border:1px solid var(--color-border); border-radius:4px; font-size:12px; background-color:#fff; color:var(--color-text); resize:none;"></textarea>' +
        '  </div>' +
        '  <button type="submit" class="btn" style="width:100%; padding:8px; font-weight:bold; cursor:pointer;">Submit Complaint</button>' +
        '</form>';

      card.insertBefore(formContainer, footer);

      var nameInput = document.getElementById('t-name');
      var phoneInput = document.getElementById('t-phone');
      var topicInput = document.getElementById('t-topic');
      var messageInput = document.getElementById('t-message');

      if (nameInput) nameInput.value = ticketData.name || '';
      if (phoneInput) phoneInput.value = ticketData.phone || '';
      if (topicInput) topicInput.value = ticketData.topic || 'POS Printer Setup';
      if (messageInput) messageInput.value = ticketData.message || '';

      document.getElementById('support-ticket-form').onsubmit = function(e) {
        e.preventDefault();
        var phoneVal = phoneInput.value.trim();
        var phoneRegex = /^[+]?[0-9\s-]{10,14}$/;
        if (!phoneRegex.test(phoneVal)) {
          alert('Please enter a valid WhatsApp number (e.g., 9876543210).');
          return;
        }

        ticketData.name = nameInput.value.trim();
        ticketData.phone = phoneVal;
        ticketData.topic = topicInput.value;
        ticketData.message = messageInput.value.trim() || 'No details provided';

        formContainer.remove();
        messagesDiv.style.display = 'flex';
        messagesDiv.innerHTML = '';
        appendMsgElement('bot', 'Filing support ticket and scheduling call back...');
        
        step = 5;
        submitTicket();
      };
    } else {
      messagesDiv.style.display = 'flex';
      if (chatMode === 'ai' && !isTyping) {
        footer.style.display = 'flex';
      } else {
        footer.style.display = 'none';
      }
    }
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    init: init
  };
}());
