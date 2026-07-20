var sbClient = require('../supabase/client');
var encryptor = require('../crypto/data-encryptor');

async function exportGSTR1(year, month) {
  var ctx = await sbClient.ensureAuthenticatedClient();
  var pattern = year + '-' + month + '-%';
  var res = await ctx.client
    .from('tax_records')
    .select('*')
    .eq('owner_id', ctx.userId)
    .like('bill_date', pattern);

  var rows = res.data || [];

  var b2bMap = {};
  var b2csMap = {};

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var decrypted = {};
    if (row.encrypted_data) {
      try {
        decrypted = encryptor.decryptObject(row.encrypted_data, row.enc_iv, row.enc_auth_tag);
      } catch(e) {
        console.error('[gstr1-export] decrypt failed for', row.bill_id);
      }
    }

    var gstin = decrypted.customer_gstin || '';
    var pos = decrypted.customer_state_code || '27';
    var rateWise = decrypted.rate_wise_breakdown || [];

    if (gstin && gstin.trim() !== '') {
      if (!b2bMap[gstin]) {
        b2bMap[gstin] = { ctin: gstin, inv: [] };
      }
      
      var rawDate = row.bill_date || '';
      var dateParts = rawDate.split('-');
      var formattedDate = dateParts.length === 3 ? dateParts[2] + '-' + dateParts[1] + '-' + dateParts[0] : rawDate;

      var invDet = {
        inum: row.bill_number,
        idt: formattedDate,
        val: row.grand_total,
        pos: pos,
        rchrg: 'N',
        inv_typ: 'R',
        itms: []
      };

      for (var r = 0; r < rateWise.length; r++) {
        var slab = rateWise[r];
        invDet.itms.push({
          num: r + 1,
          itm_det: {
            rt: slab.rate,
            txval: slab.taxable,
            iamt: slab.igst || 0,
            camt: slab.cgst || 0,
            samt: slab.sgst || 0
          }
        });
      }
      b2bMap[gstin].inv.push(invDet);
    } else {
      for (var r = 0; r < rateWise.length; r++) {
        var slab = rateWise[r];
        var key = pos + '_' + slab.rate;
        if (!b2csMap[key]) {
          b2csMap[key] = {
            sply_ty: row.total_igst > 0 ? 'INTERSTATE' : 'INTRASTATE',
            pos: pos,
            rt: slab.rate,
            txval: 0,
            iamt: 0,
            camt: 0,
            samt: 0
          };
        }
        b2csMap[key].txval += slab.taxable;
        b2csMap[key].iamt += (slab.igst || 0);
        b2csMap[key].camt += (slab.cgst || 0);
        b2csMap[key].samt += (slab.sgst || 0);
      }
    }
  }

  var b2b = [];
  for (var k in b2bMap) {
    if (b2bMap.hasOwnProperty(k)) b2b.push(b2bMap[k]);
  }

  var b2cs = [];
  for (var k in b2csMap) {
    if (b2csMap.hasOwnProperty(k)) {
      var item = b2csMap[k];
      b2cs.push({
        sply_ty: item.sply_ty,
        pos: item.pos,
        rt: item.rt,
        txval: Math.round(item.txval * 100) / 100,
        iamt: Math.round(item.iamt * 100) / 100,
        camt: Math.round(item.camt * 100) / 100,
        samt: Math.round(item.samt * 100) / 100
      });
    }
  }

  return {
    b2b: b2b,
    b2cs: b2cs
  };
}

module.exports = {
  exportGSTR1: exportGSTR1
};
