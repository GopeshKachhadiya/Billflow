function toWords(num) {
  num = Math.round(parseFloat(num) || 0);
  if (num === 0) return 'Zero Rupees Only';

  var single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  var double = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertLessThanThousand(n) {
    var str = '';
    if (n >= 100) {
      str += single[Math.floor(n / 100)] + ' Hundred ';
      n = n % 100;
    }
    if (n >= 20) {
      str += double[Math.floor(n / 10)] + ' ';
      n = n % 10;
    }
    if (n > 0) {
      str += single[n] + ' ';
    }
    return str;
  }

  var str = '';
  var crore = Math.floor(num / 10000000);
  num = num % 10000000;
  var lakh = Math.floor(num / 100000);
  num = num % 100000;
  var thousand = Math.floor(num / 1000);
  num = num % 1000;

  if (crore > 0) {
    str += convertLessThanThousand(crore) + 'Crore ';
  }
  if (lakh > 0) {
    str += convertLessThanThousand(lakh) + 'Lakh ';
  }
  if (thousand > 0) {
    str += convertLessThanThousand(thousand) + 'Thousand ';
  }
  if (num > 0) {
    str += convertLessThanThousand(num);
  }

  return str.trim() + ' Rupees Only';
}

module.exports = {
  toWords: toWords
};
