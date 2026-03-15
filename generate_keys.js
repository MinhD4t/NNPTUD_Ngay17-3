const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateKeys() {
    console.log('Đang tạo cặp khóa RSA 2048-bit...');
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'pkcs1',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs1',
            format: 'pem'
        }
    });

    const publicPath = path.join(__dirname, 'public.pem');
    const privatePath = path.join(__dirname, 'private.pem');

    fs.writeFileSync(publicPath, publicKey);
    fs.writeFileSync(privatePath, privateKey);

    console.log('Đã tạo thành công cặp khóa!');
    console.log('Public Key lưu tại:', publicPath);
    console.log('Private Key lưu tại:', privatePath);
}

generateKeys();
