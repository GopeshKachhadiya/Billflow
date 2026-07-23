const billNumber = require('./bill-number');
const settings = require('../db/queries/settings');

jest.mock('../db/queries/settings', () => {
  let mockSettings = {};
  return {
    getSetting: jest.fn((key) => mockSettings[key]),
    setSetting: jest.fn((key, val) => { mockSettings[key] = val; }),
    _reset: () => { mockSettings = {}; }
  };
});

describe('Bill Number Generator', () => {
  beforeEach(() => {
    settings._reset();
    jest.clearAllMocks();
  });

  test('should generate default bill number format', () => {
    const year = new Date().getFullYear();
    expect(billNumber.getNextBillNumber()).toBe(`INV-${year}-001`);
  });

  test('should use custom prefix and next number', () => {
    const year = new Date().getFullYear();
    settings.setSetting('bill_prefix', 'EST');
    settings.setSetting('bill_next_number', '42');
    
    expect(billNumber.getNextBillNumber()).toBe(`EST-${year}-042`);
  });

  test('should increment bill number', () => {
    settings.setSetting('bill_next_number', '10');
    billNumber.incrementBillNumber();
    expect(settings.setSetting).toHaveBeenCalledWith('bill_next_number', '11');
    expect(settings.getSetting('bill_next_number')).toBe('11');
  });

  test('should handle missing next number gracefully on increment', () => {
    billNumber.incrementBillNumber();
    expect(settings.setSetting).toHaveBeenCalledWith('bill_next_number', '2');
  });
});
