import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Generate private key
console.log('Generating private key...');
execSync('openssl ecparam -name prime256v1 -genkey -noout -out private-key.pem');

// Generate public key
console.log('Generating public key...');
execSync('openssl ec -in private-key.pem -pubout -out public-key.pem');

// Create .well-known directory structure in the public folder
const wellKnownPath = path.join('..', 'public', '.well-known', 'appspecific');
fs.mkdirSync(wellKnownPath, { recursive: true });

// Copy public key to the .well-known directory
fs.copyFileSync(
  'public-key.pem',
  path.join(wellKnownPath, 'com.tesla.3p.public-key.pem')
);

console.log('Keys generated successfully!');
console.log('Private key saved as: private-key.pem');
console.log('Public key saved and copied to public/.well-known/appspecific/com.tesla.3p.public-key.pem');