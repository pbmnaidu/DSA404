const fs = require('fs');
const path = 'p:/DSA404-chatBot/src/lib/push.ts';
let data = fs.readFileSync(path, 'utf8');

data = data.replace(
  'console.warn("[push] Stage A: FCM Messaging is not supported in this browser environment.");',
  '// console.warn("[push] Stage A: FCM Messaging is not supported in this browser environment.");'
);

fs.writeFileSync(path, data);
console.log('Fixed warning');
