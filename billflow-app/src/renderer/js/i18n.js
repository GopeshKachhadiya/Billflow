(function() {
  'use strict';

  var translations = {
    en: {
      // Navigation
      "nav_dashboard": "Dashboard",
      "nav_inbox": "Inbox",
      "nav_bills": "Bills",
      "nav_customers": "Customers",
      "nav_catalog": "Items",
      "nav_expenses": "Expenses",
      "nav_reports": "Reports",
      "nav_settings": "Settings",
      "nav_logout": "Logout",

      // Status bar
      "status_synced": "● Synced",

      // Common Buttons & Labels
      "btn_save": "Save",
      "btn_cancel": "Cancel",
      "btn_edit": "Edit",
      "btn_delete": "Delete",
      "btn_create": "Create",
      "btn_search": "Search",
      "btn_filter": "Filter",
      "btn_close": "Close",
      "btn_add": "Add",
      "btn_actions": "Actions",
      "btn_back": "Back",
      "btn_export": "Export",
      "btn_import": "Import",
      "btn_print": "Print",
      "btn_pdf": "Download PDF",
      "btn_whatsapp": "Share WhatsApp",
      "loading": "Loading...",
      "no_data": "No records found",
      "select_option": "Select an option",

      // Language Switcher
      "language_label": "Language",
      "lang_en": "English",
      "lang_hi": "हिन्दी",
      "lang_gu": "ગુજરાતી",

      // Dashboard
      "dashboard_title": "Dashboard",
      "total_revenue": "Total Revenue",
      "outstanding_bills": "Outstanding Bills",
      "total_customers": "Total Customers",
      "total_items": "Total Items",
      "quick_actions": "Quick Actions",
      "create_new_bill": "Create New Bill",
      "add_new_customer": "Add Customer",
      "recent_bills": "Recent Bills",
      "invoice_no": "Invoice No.",
      "customer": "Customer",
      "date": "Date",
      "amount": "Amount",
      "status": "Status",

      // Statuses
      "status_paid": "Paid",
      "status_pending": "Pending",
      "status_overdue": "Overdue",
      "status_partially_paid": "Partially Paid",
      "status_cancelled": "Cancelled",

      // Bills List & Edit
      "bills_title": "Bills & Invoices",
      "new_bill": "+ New Bill",
      "search_bills_ph": "Search by invoice no or customer...",
      "all_statuses": "All Statuses",
      "bill_details": "Bill Details",
      "customer_details": "Customer Details",
      "select_customer": "Select Customer",
      "bill_date": "Bill Date",
      "due_date": "Due Date",
      "item_name": "Item Name",
      "hsn_sac": "HSN/SAC",
      "quantity": "Qty",
      "rate": "Rate (₹)",
      "tax_rate": "Tax (%)",
      "total": "Total (₹)",
      "add_item": "+ Add Item",
      "subtotal": "Subtotal",
      "cgst": "CGST",
      "sgst": "SGST",
      "igst": "IGST",
      "total_amount": "Total Amount",
      "notes": "Notes / Terms",

      // Customers List & Edit
      "customers_title": "Customers",
      "new_customer": "+ New Customer",
      "search_customers_ph": "Search by name or phone...",
      "customer_name": "Customer Name",
      "phone": "Phone Number",
      "email": "Email Address",
      "gstin": "GSTIN",
      "address": "Address",
      "city": "City",
      "state": "State",
      "pincode": "PIN Code",

      // Catalog / Items
      "catalog_title": "Items & Products",
      "new_item": "+ New Item",
      "search_items_ph": "Search items by name or code...",
      "unit_price": "Unit Price",
      "default_gst": "Default GST Rate",
      "unit": "Unit",

      // Expenses
      "expenses_title": "Expenses",
      "new_expense": "+ New Expense",
      "search_expenses_ph": "Search expenses...",
      "category": "Category",
      "expense_date": "Expense Date",

      // Reports
      "reports_title": "Reports & Analytics",
      "sales_report": "Sales Report",
      "tax_summary": "Tax Summary (GSTR-1)",
      "expense_report": "Expense Report",

      // Inbox
      "inbox_title": "Incoming Bills Inbox",
      "search_inbox_ph": "Search incoming bills...",

      // Settings
      "settings_title": "Settings",
      "save_settings": "Save Settings",
      "tab_business": "Business Profile",
      "tab_template": "Bill Template",
      "tab_integrations": "Integrations",
      "tab_language": "Language Preference",
      "business_name": "Business Name",
      "business_phone": "Business Mobile / Phone",
      "business_email": "Business Email",
      "bank_name": "Bank Name",
      "account_number": "Account Number",
      "ifsc_code": "IFSC Code",
      "app_language_setting": "App Display Language",

      // Support Chatbot
      "bot_title": "BillFlow Priority Support",
      "bot_welcome": "Hello! Welcome to priority support. 🤖 How can we assist you today?",
      "bot_input_ph": "Type your message..."
    },

    hi: {
      // Navigation
      "nav_dashboard": "डैशबोर्ड",
      "nav_inbox": "इनबॉक्स",
      "nav_bills": "बिल एवं इनवॉइस",
      "nav_customers": "ग्राहक (Customers)",
      "nav_catalog": "सामग्री (Items)",
      "nav_expenses": "खर्चे (Expenses)",
      "nav_reports": "रिपोर्ट्स",
      "nav_settings": "सेटिंग्स",
      "nav_logout": "लॉगआउट",

      // Status bar
      "status_synced": "● सिंक किया गया",

      // Common Buttons & Labels
      "btn_save": "सहेजें (Save)",
      "btn_cancel": "रद्द करें",
      "btn_edit": "संशोधन करें (Edit)",
      "btn_delete": "हटाएं (Delete)",
      "btn_create": "बनाएं",
      "btn_search": "खोजें",
      "btn_filter": "फ़िल्टर",
      "btn_close": "बंद करें",
      "btn_add": "जोड़ें",
      "btn_actions": "कार्रवाई (Actions)",
      "btn_back": "वापस जाएं",
      "btn_export": "निर्यात करें (Export)",
      "btn_import": "आयात करें (Import)",
      "btn_print": "प्रिंट करें",
      "btn_pdf": "PDF डाउनलोड करें",
      "btn_whatsapp": "व्हाट्सएप पर शेयर करें",
      "loading": "लोड हो रहा है...",
      "no_data": "कोई रिकॉर्ड नहीं मिला",
      "select_option": "एक विकल्प चुनें",

      // Language Switcher
      "language_label": "भाषा (Language)",
      "lang_en": "English",
      "lang_hi": "हिन्दी",
      "lang_gu": "ગુજરાતી",

      // Dashboard
      "dashboard_title": "डैशबोर्ड",
      "total_revenue": "कुल राजस्व (Revenue)",
      "outstanding_bills": "बकाया बिल",
      "total_customers": "कुल ग्राहक",
      "total_items": "कुल सामग्री",
      "quick_actions": "त्वरित कार्रवाई",
      "create_new_bill": "नया बिल बनाएं",
      "add_new_customer": "ग्राहक जोड़ें",
      "recent_bills": "हाल के बिल",
      "invoice_no": "इनवॉइस सं.",
      "customer": "ग्राहक",
      "date": "दिनांक",
      "amount": "राशि",
      "status": "स्थिति",

      // Statuses
      "status_paid": "भुगतान किया गया (Paid)",
      "status_pending": "लंबित (Pending)",
      "status_overdue": "अतिदेय (Overdue)",
      "status_partially_paid": "आंशिक भुगतान",
      "status_cancelled": "रद्द (Cancelled)",

      // Bills List & Edit
      "bills_title": "बिल एवं इनवॉइस",
      "new_bill": "+ नया बिल",
      "search_bills_ph": "इनवॉइस नंबर या ग्राहक खोजें...",
      "all_statuses": "सभी स्थितियां",
      "bill_details": "बिल विवरण",
      "customer_details": "ग्राहक विवरण",
      "select_customer": "ग्राहक चुनें",
      "bill_date": "बिल तिथि",
      "due_date": "अंतिम तिथि",
      "item_name": "सामग्री का नाम",
      "hsn_sac": "HSN/SAC",
      "quantity": "मात्रा (Qty)",
      "rate": "दर (₹)",
      "tax_rate": "कर (%)",
      "total": "कुल (₹)",
      "add_item": "+ सामग्री जोड़ें",
      "subtotal": "उप-कुल (Subtotal)",
      "cgst": "CGST",
      "sgst": "SGST",
      "igst": "IGST",
      "total_amount": "कुल राशि",
      "notes": "टिप्पणियां / शर्तें",

      // Customers List & Edit
      "customers_title": "ग्राहक",
      "new_customer": "+ नया ग्राहक",
      "search_customers_ph": "नाम या फोन नंबर द्वारा खोजें...",
      "customer_name": "ग्राहक का नाम",
      "phone": "फोन नंबर",
      "email": "ईमेल पता",
      "gstin": "जीएसटीआईएन (GSTIN)",
      "address": "पता",
      "city": "शहर",
      "state": "राज्य",
      "pincode": "पिन कोड",

      // Catalog / Items
      "catalog_title": "सामग्री एवं उत्पाद",
      "new_item": "+ नई सामग्री",
      "search_items_ph": "नाम या कोड से खोजें...",
      "unit_price": "इकाई मूल्य (Price)",
      "default_gst": "डिफ़ॉल्ट जीएसटी दर",
      "unit": "इकाई (Unit)",

      // Expenses
      "expenses_title": "खर्चे",
      "new_expense": "+ नया खर्चा",
      "search_expenses_ph": "खर्चे खोजें...",
      "category": "श्रेणी (Category)",
      "expense_date": "खर्चे की तिथि",

      // Reports
      "reports_title": "रिपोर्ट और विश्लेषण",
      "sales_report": "बिक्री रिपोर्ट",
      "tax_summary": "कर सारांश (GSTR-1)",
      "expense_report": "खर्चों की रिपोर्ट",

      // Inbox
      "inbox_title": "आवक बिल इनबॉक्स",
      "search_inbox_ph": "आवक बिल खोजें...",

      // Settings
      "settings_title": "सेटिंग्स",
      "save_settings": "सेटिंग्स सहेजें",
      "tab_business": "व्यवसाय प्रोफ़ाइल",
      "tab_template": "बिल टेम्पलेट",
      "tab_integrations": "एकीकरण (Integrations)",
      "tab_language": "भाषा प्राथमिकता",
      "business_name": "व्यवसाय का नाम",
      "business_phone": "व्यवसाय मोबाइल / फोन",
      "business_email": "व्यवसाय ईमेल",
      "bank_name": "बैंक का नाम",
      "account_number": "खाता संख्या",
      "ifsc_code": "IFSC कोड",
      "app_language_setting": "ऐप की भाषा चुनें",

      // Support Chatbot
      "bot_title": "बिलफ़्लो सहायता",
      "bot_welcome": "नमस्ते! बिलफ़्लो सहायता में आपका स्वागत है। 🤖 हम आपकी क्या सहायता कर सकते हैं?",
      "bot_input_ph": "अपना संदेश लिखें..."
    },

    gu: {
      // Navigation
      "nav_dashboard": "ડેશબોર્ડ",
      "nav_inbox": "ઇનબોક્સ",
      "nav_bills": "બિલ અને ઇનવોઇસ",
      "nav_customers": "ગ્રાહકો (Customers)",
      "nav_catalog": "વસ્તુઓ (Items)",
      "nav_expenses": "ખર્ચા (Expenses)",
      "nav_reports": "રિપોર્ટ્સ",
      "nav_settings": "સેટિંગ્સ",
      "nav_logout": "લોગઆઉટ",

      // Status bar
      "status_synced": "● સિંક થયેલ છે",

      // Common Buttons & Labels
      "btn_save": "સાચવો (Save)",
      "btn_cancel": "રદ કરો",
      "btn_edit": "ફેરફાર કરો (Edit)",
      "btn_delete": "કાઢી નાખો (Delete)",
      "btn_create": "બનાવો",
      "btn_search": "શોધો",
      "btn_filter": "ફિલ્ટર",
      "btn_close": "બંધ કરો",
      "btn_add": "ઉમેરો",
      "btn_actions": "પ્રક્રિયાઓ (Actions)",
      "btn_back": "પાછા જાઓ",
      "btn_export": "એક્સપોર્ટ કરો",
      "btn_import": "ઇમ્પોર્ટ કરો",
      "btn_print": "પ્રિન્ટ કરો",
      "btn_pdf": "PDF ડાઉનલોડ કરો",
      "btn_whatsapp": "વોટ્સએપ પર શેર કરો",
      "loading": "લોડ થઈ રહ્યું છે...",
      "no_data": "કોઈ રેકોર્ડ મળ્યો નથી",
      "select_option": "એક વિકલ્પ પસંદ કરો",

      // Language Switcher
      "language_label": "ભાષા (Language)",
      "lang_en": "English",
      "lang_hi": "हिन्दी",
      "lang_gu": "ગુજરાતી",

      // Dashboard
      "dashboard_title": "ડેશબોર્ડ",
      "total_revenue": "કુલ આવક (Revenue)",
      "outstanding_bills": "બાકી બિલ",
      "total_customers": "કુલ ગ્રાહકો",
      "total_items": "કુલ વસ્તુઓ",
      "quick_actions": "ઝડપી પ્રક્રિયાઓ",
      "create_new_bill": "નવું બિલ બનાવો",
      "add_new_customer": "ગ્રાહક ઉમેરો",
      "recent_bills": "તાજેતરના બિલ",
      "invoice_no": "ઇનવોઇસ નં.",
      "customer": "ગ્રાહક",
      "date": "તારીખ",
      "amount": "રકમ",
      "status": "સ્થિતિ",

      // Statuses
      "status_paid": "ચૂકવેલ (Paid)",
      "status_pending": "બાકી (Pending)",
      "status_overdue": "મુદત પૂરી થયેલ",
      "status_partially_paid": "અંશતઃ ચૂકવેલ",
      "status_cancelled": "રદ કરેલ",

      // Bills List & Edit
      "bills_title": "બિલ અને ઇનવોઇસ",
      "new_bill": "+ નવું બિલ",
      "search_bills_ph": "ઇનવોઇસ નંબર અથવા ગ્રાહક શોધો...",
      "all_statuses": "તમામ સ્થિતિ",
      "bill_details": "બિલ વિગત",
      "customer_details": "ગ્રાહક વિગત",
      "select_customer": "ગ્રાહક પસંદ કરો",
      "bill_date": "બિલ તારીખ",
      "due_date": "છેલ્લી તારીખ",
      "item_name": "વસ્તુનું નામ",
      "hsn_sac": "HSN/SAC",
      "quantity": "જથ્થો (Qty)",
      "rate": "ભાવ (₹)",
      "tax_rate": "ટેક્સ (%)",
      "total": "કુલ (₹)",
      "add_item": "+ વસ્તુ ઉમેરો",
      "subtotal": "સબટોટલ (Subtotal)",
      "cgst": "CGST",
      "sgst": "SGST",
      "igst": "IGST",
      "total_amount": "કુલ રકમ",
      "notes": "નોંધ / શરતો",

      // Customers List & Edit
      "customers_title": "ગ્રાહકો",
      "new_customer": "+ નવો ગ્રાહક",
      "search_customers_ph": "નામ અથવા ફોન નંબરથી શોધો...",
      "customer_name": "ગ્રાહકનું નામ",
      "phone": "ફોન નંબર",
      "email": "ઈમેલ સરનામું",
      "gstin": "જીએસટીઆઈએન (GSTIN)",
      "address": "સરનામું",
      "city": "શહેર",
      "state": "રાજ્ય",
      "pincode": "પિન કોડ",

      // Catalog / Items
      "catalog_title": "વસ્તુઓ અને પ્રોડક્ટ્સ",
      "new_item": "+ નવી વસ્તુ",
      "search_items_ph": "નામ અથવા કોડથી શોધો...",
      "unit_price": "એકમ કિંમત (Price)",
      "default_gst": "ડિફોલ્ટ જીએસટી દર",
      "unit": "એકમ (Unit)",

      // Expenses
      "expenses_title": "ખર્ચા",
      "new_expense": "+ નવો ખર્ચ",
      "search_expenses_ph": "ખર્ચા શોધો...",
      "category": "કેટેગરી",
      "expense_date": "ખર્ચ તારીખ",

      // Reports
      "reports_title": "રિપોર્ટ્સ અને એનાલિટિક્સ",
      "sales_report": "વેચાણ રિપોર્ટ",
      "tax_summary": "ટેક્સ સમરી (GSTR-1)",
      "expense_report": "ખર્ચ રિપોર્ટ",

      // Inbox
      "inbox_title": "આવક બિલ ઇનબોક્સ",
      "search_inbox_ph": "આવક બિલ શોધો...",

      // Settings
      "settings_title": "સેટિંગ્સ",
      "save_settings": "સેટિંગ્સ સાચવો",
      "tab_business": "બિઝનેસ પ્રોફાઇલ",
      "tab_template": "બિલ ટેમ્પલેટ",
      "tab_integrations": "ઇન્ટિગ્રેશન્સ",
      "tab_language": "ભાષા પસંદગી",
      "business_name": "બિઝનેસનું નામ",
      "business_phone": "બિઝનેસ મોબાઇલ / ફોન",
      "business_email": "બિઝનેસ ઈમેલ",
      "bank_name": "બેંકનું નામ",
      "account_number": "ખાતા નંબર",
      "ifsc_code": "IFSC કોડ",
      "app_language_setting": "એપની ભાષા પસંદ કરો",

      // Support Chatbot
      "bot_title": "બિલફ્લો સહાયતા",
      "bot_welcome": "નમસ્તે! બિલફ્લો સહાયતામાં આપનું સ્વાગત છે. 🤖 આજે તમને કેવી રીતે મદદ કરી શકીએ?",
      "bot_input_ph": "તમારો સંદેશ લખો..."
    }
  };

  var currentLanguage = 'en';

  var i18n = {
    init: function() {
      if (typeof localStorage !== 'undefined') {
        var savedLang = localStorage.getItem('app_language');
        if (savedLang && translations[savedLang]) {
          currentLanguage = savedLang;
        }
      }
      this.applyTranslations();
    },

    getLanguage: function() {
      return currentLanguage;
    },

    setLanguage: function(lang) {
      if (!translations[lang]) return;
      currentLanguage = lang;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('app_language', lang);
      }

      if (typeof window !== 'undefined' && window.api && typeof window.api.setSetting === 'function') {
        window.api.setSetting('app_language', lang).catch(function(err) {
          console.warn('[i18n] Failed to save setting:', err);
        });
      }

      // Update dropdown elements across app
      if (typeof document !== 'undefined') {
        var selectors = document.querySelectorAll('#topbar-lang-select, #s-app_language');
        for (var i = 0; i < selectors.length; i++) {
          selectors[i].value = lang;
        }
      }

      this.applyTranslations();

      // Dispatch event for components that need custom refresh
      if (typeof window !== 'undefined') {
        var evt = new CustomEvent('languageChanged', { detail: { language: lang } });
        window.dispatchEvent(evt);
      }
    },

    t: function(key, fallback) {
      if (translations[currentLanguage] && translations[currentLanguage][key]) {
        return translations[currentLanguage][key];
      }
      if (translations.en && translations.en[key]) {
        return translations.en[key];
      }
      return fallback !== undefined ? fallback : key;
    },

    applyTranslations: function(root) {
      if (typeof document === 'undefined') return;
      var scope = root || document;

      // Translate text elements with data-i18n
      var elements = scope.querySelectorAll('[data-i18n]');
      for (var i = 0; i < elements.length; i++) {
        var el = elements[i];
        var key = el.getAttribute('data-i18n');
        var translated = this.t(key);
        if (translated) {
          // If element has dynamic badge or sub-elements, only update direct text node if possible
          if (el.children.length === 0) {
            el.textContent = translated;
          } else {
            // Preserving sub-elements like badges if any
            var firstChild = el.childNodes[0];
            if (firstChild && firstChild.nodeType === Node.TEXT_NODE) {
              firstChild.nodeValue = translated + ' ';
            } else {
              el.insertBefore(document.createTextNode(translated + ' '), el.firstChild);
            }
          }
        }
      }

      // Translate placeholders
      var placeholders = scope.querySelectorAll('[data-i18n-placeholder]');
      for (var j = 0; j < placeholders.length; j++) {
        var pel = placeholders[j];
        var pkey = pel.getAttribute('data-i18n-placeholder');
        var ptranslated = this.t(pkey);
        if (ptranslated) {
          pel.setAttribute('placeholder', ptranslated);
        }
      }

      // Translate titles
      var titles = scope.querySelectorAll('[data-i18n-title]');
      for (var k = 0; k < titles.length; k++) {
        var tel = titles[k];
        var tkey = tel.getAttribute('data-i18n-title');
        var ttranslated = this.t(tkey);
        if (ttranslated) {
          tel.setAttribute('title', ttranslated);
        }
      }
    }
  };

  (typeof window !== 'undefined' ? window : global).i18n = i18n;
})();
