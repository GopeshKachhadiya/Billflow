var crypto = require('crypto');

async function getClientAndUser() {
  return await require('../../supabase/client').ensureAuthenticatedClient();
}

async function upsertTaxRecord(billId, data) {
  var ctx = await getClientAndUser();
  var now = new Date().toISOString();

  var payload = {
    owner_id: ctx.userId,
    bill_id: billId,
    bill_date: data.bill_date || now.split('T')[0],
    bill_number: data.bill_number || '',
    total_taxable: parseFloat(data.total_taxable) || 0,
    total_cgst: parseFloat(data.total_cgst) || 0,
    total_sgst: parseFloat(data.total_sgst) || 0,
    total_igst: parseFloat(data.total_igst) || 0,
    total_tax: parseFloat(data.total_tax) || 0,
    grand_total: parseFloat(data.grand_total) || 0,
    updated_at: now
  };

  var res = await ctx.client.from('tax_records').upsert(payload, { onConflict: 'bill_id' });
  if (res.error) throw new Error('Cloud tax record upsert error: ' + res.error.message);

  return { ok: true };
}

async function getTaxRecord(billId) {
  var ctx = await getClientAndUser();
  var res = await ctx.client
    .from('tax_records')
    .select('*')
    .eq('owner_id', ctx.userId)
    .eq('bill_id', billId)
    .single();

  if (res.error || !res.data) return null;
  return res.data;
}

async function getTaxSummary(filter) {
  filter = filter || {};
  var ctx = await getClientAndUser();
  var query = ctx.client
    .from('tax_records')
    .select('total_taxable, total_cgst, total_sgst, total_igst, total_tax, grand_total')
    .eq('owner_id', ctx.userId);

  if (filter.dateFrom) query = query.gte('bill_date', filter.dateFrom);
  if (filter.dateTo)   query = query.lte('bill_date', filter.dateTo);

  var res = await query;
  if (res.error) return {};

  var rows = res.data || [];
  var summary = {
    total_taxable: 0,
    total_cgst: 0,
    total_sgst: 0,
    total_igst: 0,
    total_tax: 0,
    grand_total: 0,
    invoice_count: rows.length
  };

  rows.forEach(function(r) {
    summary.total_taxable += parseFloat(r.total_taxable) || 0;
    summary.total_cgst    += parseFloat(r.total_cgst)    || 0;
    summary.total_sgst    += parseFloat(r.total_sgst)    || 0;
    summary.total_igst    += parseFloat(r.total_igst)    || 0;
    summary.total_tax     += parseFloat(r.total_tax)     || 0;
    summary.grand_total   += parseFloat(r.grand_total)   || 0;
  });

  return summary;
}

async function getMonthlyGSTSummary(year) {
  var ctx = await getClientAndUser();
  var startOfYear = String(year) + '-01-01';
  var endOfYear   = String(year) + '-12-31';

  var res = await ctx.client
    .from('tax_records')
    .select('bill_date, total_taxable, total_cgst, total_sgst, total_igst, total_tax')
    .eq('owner_id', ctx.userId)
    .gte('bill_date', startOfYear)
    .lte('bill_date', endOfYear);

  if (res.error) return [];

  var rows = res.data || [];
  var monthMap = {};

  rows.forEach(function(r) {
    var m = r.bill_date ? r.bill_date.substring(0, 7) : String(year) + '-01';
    if (!monthMap[m]) {
      monthMap[m] = { month: m, taxable: 0, cgst: 0, sgst: 0, igst: 0, tax: 0, count: 0 };
    }
    monthMap[m].taxable += parseFloat(r.total_taxable) || 0;
    monthMap[m].cgst    += parseFloat(r.total_cgst)    || 0;
    monthMap[m].sgst    += parseFloat(r.total_sgst)    || 0;
    monthMap[m].igst    += parseFloat(r.total_igst)    || 0;
    monthMap[m].tax     += parseFloat(r.total_tax)     || 0;
    monthMap[m].count   += 1;
  });

  var months = Object.keys(monthMap).sort();
  return months.map(function(m) { return monthMap[m]; });
}

module.exports = {
  upsertTaxRecord: upsertTaxRecord,
  getTaxRecord: getTaxRecord,
  getTaxSummary: getTaxSummary,
  getMonthlyGSTSummary: getMonthlyGSTSummary
};
