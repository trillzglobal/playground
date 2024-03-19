import * as crypto from 'crypto'

class CvvCalculation {
    constructor() {}

    private hexStringToByteArray(key) {
        const result = Buffer.alloc(key.length / 2);
        for (let i = 0; i < key.length; i += 2) {
          result[i / 2] = parseInt(key.substring(i, i + 2), 16);
        }
        return result;
      }
    
      private byteArrayToHexString(key) {
        let st = '';
        for (let i = 0; i < key.length; i++) {
          const hex = key[i].toString(16).toUpperCase();
          st += hex.length === 1 ? '0' + hex : hex;
        }
        return st;
      }

      
    private encryptWithDES(input: string, key: string): string {
        const cipher = crypto.createCipheriv('des-ecb', this.hexStringToByteArray(key), null);
        let encrypted = cipher.update(Buffer.from(input, 'hex'));
        // encrypted += cipher.final('hex');
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        this.decryptWithDES(encrypted.toString('hex'), key)
        return encrypted.toString('hex').substring(0,16).toUpperCase();
    }

    private decryptWithDES(input: string, key: string): string {
        try {
            console.log('Decrypt Input',{input, key})
            const decipher = crypto.createDecipheriv('des-ecb', this.hexStringToByteArray(key), null);
            let decrypted = decipher.update(Buffer.from(input, 'hex'));
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            console.log('decrypted',decrypted.toString('hex'));
            return decrypted.toString('utf8').toUpperCase();
        } catch (error) {
            console.error('Decryption error:', error.message);
            return ''; // Handle decryption failure gracefully
        }
    }

    private XORStrings(valueA: string, valueB: string): string {
        let result = '';
        const a = valueA.split('');
        const b = valueB.split('');
        for (let i = 0; i < a.length; i++) {
            result += (parseInt(a[i], 16) ^ parseInt(b[i], 16))
          .toString(16)
          .toUpperCase();
        }
        return result;
    }

    public getCVV(pan: string, expiry: string, svc: string, cvk: string): string {
        const paddedInput = `${pan}${expiry}${svc}`.padEnd(32, '0');
        const [A1, A2] = [paddedInput.slice(0, 16), paddedInput.slice(16)];
        console.log("Value",{A1, A2})
        const [K1, K2] = [cvk.slice(0, 16), cvk.slice(16)];
        console.log("Key", {K1,K2})
        const step4 = this.encryptWithDES(A1, K1);
        console.log("Step 4", step4)
        const step5 = this.XORStrings(step4, A2);
        console.log("Step 5", step5)
        const step6 = this.encryptWithDES(step5, K1);
        console.log("Step 6", step6)
        const step7 = this.decryptWithDES(step6, K2);
        console.log("Step 7", step7)
        const step8 = this.encryptWithDES(step7, K1);
        console.log("Step 8", step8)
        const step9 = step8.replace(/\D/g, '');

        return step9.slice(0, 3);
    }
}

// Usage example
const cvvCalculator = new CvvCalculation();
const cvv = cvvCalculator.getCVV('4123121234567891', '2312', '201', '1234567890ABCDEF5678901234ABCDEF');
console.log('Calculated CVV:', cvv);
