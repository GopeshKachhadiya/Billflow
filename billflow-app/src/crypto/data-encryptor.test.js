const encryptor = require('./data-encryptor');

const crypto = require('crypto');

describe('Data Encryptor', () => {
  beforeEach(() => {
    // AES-256 requires exactly 32 bytes Buffer
    const testKey = Buffer.alloc(32, 'a');
    encryptor.setKey(testKey);
  });

  afterEach(() => {
    encryptor.clearKey();
  });

  test('should throw error if key is not set', () => {
    encryptor.clearKey();
    expect(() => encryptor.encryptObject({ test: 'data' })).toThrow('Encryption key not set');
  });

  test('should encrypt and decrypt objects correctly', () => {
    const obj = { name: 'Test Customer', address: '123 Fake St', items: [1, 2, 3] };
    const encrypted = encryptor.encryptObject(obj);
    expect(encrypted.encryptedData).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.authTag).toBeDefined();

    const decrypted = encryptor.decryptObject(encrypted.encryptedData, encrypted.iv, encrypted.authTag);
    expect(decrypted).toEqual(obj);
  });

  // Duplicate block removed

  test('encryptCustomer should map metadata properly and encrypt the rest', () => {
    const customer = {
      name: 'John Doe',
      phone: '1234567890',
      email: 'john@example.com',
      notes: 'Very sensitive notes',
      address: 'Secret Location'
    };
    
    const result = encryptor.encryptCustomer(customer);
    
    // Metadata should be exposed
    expect(result.meta.name).toBe('John Doe');
    expect(result.meta.phone).toBe('1234567890');
    expect(result.meta.email).toBe('john@example.com');
    
    // Sensitive data should be encrypted
    expect(result.meta.notes).toBeUndefined();
    expect(result.meta.address).toBeUndefined();
    
    expect(result.encryptedData).toBeDefined();
    expect(result.iv).toBeDefined();
    expect(result.authTag).toBeDefined();

    // Verify decryption yields original
    const decryptedObj = encryptor.decryptObject(result.encryptedData, result.iv, result.authTag);
    expect(decryptedObj.notes).toBe('Very sensitive notes');
    expect(decryptedObj.address).toBe('Secret Location');
  });
});
