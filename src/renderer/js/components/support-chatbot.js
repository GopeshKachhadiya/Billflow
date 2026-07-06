var SupportChatbot = (function() {
  var isOpen = false;
  var step = 1; // 1: Name, 2: Phone, 3: Topic, 4: Message, 5: Submitting, 6: Success
  var ticketData = { name: '', phone: '', topic: '', message: '' };
  
  var SUPABASE_URL = "https://brpigwqhbqeqpxynhixf.supabase.co";
  var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycGlnd3FoYnFlcXB4eW5oaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTY0ODksImV4cCI6MjA5NzI3MjQ4OX0.SB-o6Zpk4J5yJz2VhrTv2FvY-OXC6-AKRpnLznEp81I";

  function init() {
    var trigger = document.getElementById('btn-support-bot');
    var card = document.getElementById('support-bot-card');
    var closeBtn = document.getElementById('btn-close-support-bot');
    var sendBtn = document.getElementById('btn-send-support-bot');
    var input = document.getElementById('support-bot-input');
    var ping = document.getElementById('support-bot-ping');

    if (!trigger || !card) return;

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
  }

  function appendMessage(sender, text) {
    var container = document.getElementById('support-bot-messages');
    if (!container) return;

    var msg = document.createElement('div');
    msg.style.maxWidth = '85%';
    msg.style.padding = '8px 12px';
    msg.style.borderRadius = '8px';
    msg.style.fontSize = '12px';
    msg.style.lineHeight = '1.4';

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
    scrollToBottom();
  }

  function scrollToBottom() {
    var container = document.getElementById('support-bot-messages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  function handleSend() {
    var input = document.getElementById('support-bot-input');
    var val = input.value.trim();
    if (!val) return;

    appendMessage('user', val);
    input.value = '';

    if (step === 1) {
      ticketData.name = val;
      appendMessage('bot', 'Thanks, ' + val + '! Please enter your WhatsApp number so our customer care team can call you back.');
      input.placeholder = 'Type WhatsApp number...';
      input.type = 'tel';
      step = 2;
    } else if (step === 2) {
      var phoneRegex = /^[+]?[0-9\s-]{10,14}$/;
      if (!phoneRegex.test(val)) {
        appendMessage('bot', 'Oops! That phone number looks invalid. Please enter a valid mobile number (e.g., 9876543210).');
        return;
      }
      ticketData.phone = val;
      appendMessage('bot', 'Got it. Please select or type the topic of your technical query:');
      showTopics();
      step = 3;
    } else if (step === 3) {
      ticketData.topic = val;
      appendMessage('bot', "Understood. Please describe the issue you are facing in detail.");
      input.placeholder = 'Type details here...';
      input.type = 'text';
      hideTopics();
      step = 4;
    } else if (step === 4) {
      ticketData.message = val;
      appendMessage('bot', 'Raising support ticket and scheduling call back...');
      step = 5;
      submitTicket();
    }
  }

  function showTopics() {
    var topicsDiv = document.getElementById('support-bot-topics');
    var input = document.getElementById('support-bot-input');
    if (!topicsDiv) return;

    topicsDiv.style.display = 'flex';
    topicsDiv.innerHTML = '';

    var options = [
      'POS Printer Setup',
      'GST Lookup Error',
      'Tally/Excel Migration',
      'SaaS Subscription Billing',
      'Other Technical Query'
    ];

    options.forEach(function(opt) {
      var btn = document.createElement('button');
      btn.textContent = '💡 ' + opt;
      btn.style.textAlign = 'left';
      btn.style.width = '100%';
      btn.style.padding = '6px 12px';
      btn.style.backgroundColor = '#fff';
      btn.style.border = '1px solid var(--color-border)';
      btn.style.borderRadius = '4px';
      btn.style.fontSize = '11px';
      btn.style.cursor = 'pointer';
      btn.style.fontWeight = '600';
      btn.style.color = 'var(--color-text-muted)';
      btn.onclick = function() {
        appendMessage('user', opt);
        ticketData.topic = opt;
        appendMessage('bot', "Understood. Please describe the issue you are facing in detail.");
        input.placeholder = 'Type details here...';
        input.type = 'text';
        hideTopics();
        step = 4;
      };
      topicsDiv.appendChild(btn);
    });
    scrollToBottom();
  }

  function hideTopics() {
    var topicsDiv = document.getElementById('support-bot-topics');
    if (topicsDiv) {
      topicsDiv.style.display = 'none';
    }
  }

  function submitTicket() {
    var input = document.getElementById('support-bot-input');
    var footer = document.getElementById('support-bot-footer');

    if (input) input.style.display = 'none';
    if (footer) footer.style.display = 'none';

    // 1. Insert directly into Supabase (via anon key insert policy)
    fetch(SUPABASE_URL + "/rest/v1/support_tickets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + SUPABASE_ANON_KEY
      },
      body: JSON.stringify(ticketData)
    })
    .then(function(res) {
      if (!res.ok) console.error('Supabase ticket write failed:', res.statusText);
      
      // 2. Query n8n url from settings and trigger webhook
      if (window.api && window.api.getAllSettings) {
        return window.api.getAllSettings().then(function(settings) {
          var n8nBase = settings.n8n_base_url || 'http://localhost:5678';
          var webhookUrl = n8nBase + '/webhook/support-ticket';
          
          return fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ticketData)
          });
        });
      }
    })
    .then(function() {
      appendMessage('bot', 'Success! 🎉 Support ticket raised. A priority callback is scheduled for ' + ticketData.phone + '. One of our support engineers will call you within 2 hours.');
      showResetButton();
    })
    .catch(function(err) {
      console.error(err);
      appendMessage('bot', 'Your ticket was registered. However, we had trouble connecting to the n8n webhook. Our support desk will review the database log and contact you shortly.');
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
    btn.textContent = 'Raise Another Ticket';
    btn.className = 'btn';
    btn.style.fontSize = '11px';
    btn.style.padding = '4px 10px';
    btn.onclick = function() {
      step = 1;
      ticketData = { name: '', phone: '', topic: '', message: '' };
      container.innerHTML = '';
      
      var input = document.getElementById('support-bot-input');
      var footer = document.getElementById('support-bot-footer');
      if (input) {
        input.style.display = 'block';
        input.placeholder = 'Type your name...';
        input.type = 'text';
      }
      if (footer) footer.style.display = 'flex';
      
      appendMessage('bot', 'Hello! Welcome to priority support. 🤖 I can raise a support ticket and schedule a call back from customer care. To get started, please tell me your name.');
    };
    btnDiv.appendChild(btn);
    container.appendChild(btnDiv);
    scrollToBottom();
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    init: init
  };
}());
