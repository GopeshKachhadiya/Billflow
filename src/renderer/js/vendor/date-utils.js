var DateUtils = (function() {
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function parseDate(str) {
    if (!str) return null;
    var p = str.split('-');
    return new Date(parseInt(p[0],10), parseInt(p[1],10)-1, parseInt(p[2],10));
  }

  function toSQL(date) {
    if (!date) return '';
    var d = (typeof date === 'string') ? parseDate(date) : date;
    return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
  }

  function toDisplay(str) {
    if (!str) return '';
    var p = str.split('-');
    return p.length === 3 ? p[2]+'/'+p[1]+'/'+p[0] : str;
  }

  function today() { return toSQL(new Date()); }

  function addDays(str, n) {
    var d = parseDate(str); d.setDate(d.getDate() + n); return toSQL(d);
  }

  var daysMap = { due_on_receipt:0, net_7:7, net_15:15, net_30:30, net_60:60 };

  function getDueDate(billDate, paymentTerms) {
    var days = daysMap[paymentTerms] || 0;
    return addDays(billDate || today(), days);
  }

  function isOverdue(dueDate, status) {
    if (!dueDate || status === 'paid' || status === 'cancelled') return false;
    return dueDate < today();
  }

  function daysUntilDue(dueDate) {
    if (!dueDate) return null;
    var diff = parseDate(dueDate).getTime() - new Date().setHours(0,0,0,0);
    return Math.ceil(diff / 86400000);
  }

  function monthLabel(yyyyMM) {
    var p = yyyyMM.split('-');
    return months[parseInt(p[1],10)-1] + ' ' + p[0];
  }

  return { parseDate:parseDate, toSQL:toSQL, toDisplay:toDisplay, today:today,
           addDays:addDays, getDueDate:getDueDate, isOverdue:isOverdue,
           daysUntilDue:daysUntilDue, monthLabel:monthLabel };
}());
