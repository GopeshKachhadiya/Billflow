var StateCodes = (function() {
  var STATE_CODES = {
    '01':'Jammu & Kashmir','02':'Himachal Pradesh','03':'Punjab','04':'Chandigarh',
    '05':'Uttarakhand','06':'Haryana','07':'Delhi','08':'Rajasthan',
    '09':'Uttar Pradesh','10':'Bihar','11':'Sikkim','12':'Arunachal Pradesh',
    '13':'Nagaland','14':'Manipur','15':'Mizoram','16':'Tripura','17':'Meghalaya',
    '18':'Assam','19':'West Bengal','20':'Jharkhand','21':'Odisha',
    '22':'Chhattisgarh','23':'Madhya Pradesh','24':'Gujarat',
    '26':'Dadra & Nagar Haveli and Daman & Diu','27':'Maharashtra',
    '28':'Andhra Pradesh','29':'Karnataka','30':'Goa','31':'Lakshadweep',
    '32':'Kerala','33':'Tamil Nadu','34':'Puducherry',
    '35':'Andaman & Nicobar Islands','36':'Telangana',
    '37':'Andhra Pradesh (New)','38':'Ladakh'
  };

  var list = [];
  for (var code in STATE_CODES) {
    if (STATE_CODES.hasOwnProperty(code)) {
      list.push({ code: code, name: STATE_CODES[code] });
    }
  }
  list.sort(function(a,b) { return a.name.localeCompare(b.name); });

  list.STATE_CODES = STATE_CODES;
  list.getStateName = function(c) { return STATE_CODES[c] || ''; };
  list.getAllStates = function() { return list; };
  list.getStateCode = function(stateName) {
    if (!stateName) return '';
    for (var code in STATE_CODES) {
      if (STATE_CODES[code].toLowerCase() === stateName.toLowerCase()) return code;
    }
    return '';
  };

  return list;
})();

if (typeof window !== 'undefined') {
  window.StateCodes = StateCodes;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StateCodes;
}
