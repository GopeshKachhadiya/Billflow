var FormatCurrency = (function() {
  function formatIndian(num) {
    num = parseFloat(num) || 0;
    var fixed    = num.toFixed(2);
    var parts    = fixed.split('.');
    var integer  = parts[0];
    var decimal  = parts[1];
    var negative = integer.charAt(0) === '-';
    if (negative) integer = integer.slice(1);
    var result = '';
    if (integer.length > 3) {
      var last3     = integer.slice(-3);
      var remaining = integer.slice(0, integer.length - 3);
      var pairs     = '';
      for (var i = remaining.length; i > 0; i -= 2) {
        var start = Math.max(0, i - 2);
        pairs = remaining.slice(start, i) + (pairs ? ',' : '') + pairs;
      }
      result = pairs + ',' + last3;
    } else { result = integer; }
    return (negative ? '-' : '') + result + '.' + decimal;
  }
  function toRupees(num) { return '\u20B9' + formatIndian(num); }
  function toShort(num) {
    num = parseFloat(num) || 0;
    if (num >= 10000000) return (num/10000000).toFixed(2)+' Cr';
    if (num >= 100000)   return (num/100000).toFixed(2)+' L';
    if (num >= 1000)     return (num/1000).toFixed(1)+' K';
    return num.toFixed(2);
  }
  function parse(str) {
    if (typeof str === 'number') return str;
    return parseFloat(String(str).replace(/[\u20B9,\s]/g,'')) || 0;
  }
  return { formatIndian:formatIndian, toRupees:toRupees, toShort:toShort, parse:parse };
}());
