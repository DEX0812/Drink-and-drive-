const os = require('os');
const fs = require('fs');
const path = require('path');

// 1. Detect local IP address
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Look for IPv4 that is not internal (like 127.0.0.1)
      if (iface.family === 'IPv4' && !iface.internal) {
        // Typically we want Wi-Fi or Ethernet interfaces (starts with 192.168. or 10. or 172.)
        if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.') || iface.address.startsWith('172.')) {
          return iface.address;
        }
      }
    }
  }
  return '192.168.31.70'; // fallback
}

const ip = getLocalIp();
console.log(`[IP-SYNC] Detected local development IP: ${ip}`);

// 2. Write to apps/rider/.env and apps/driver/.env
const envContent = `EXPO_PUBLIC_API_URL=http://${ip}:4000/api\n`;

const riderEnvPath = path.join(__dirname, 'apps/rider/.env');
const driverEnvPath = path.join(__dirname, 'apps/driver/.env');

fs.writeFileSync(riderEnvPath, envContent);
console.log(`[IP-SYNC] Updated ${riderEnvPath}`);

fs.writeFileSync(driverEnvPath, envContent);
console.log(`[IP-SYNC] Updated ${driverEnvPath}`);
