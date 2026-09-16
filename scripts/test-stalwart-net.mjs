import net from 'net';
import tls from 'tls';

function testPort(host, port, useTls = false) {
  return new Promise((resolve) => {
    const socket = useTls 
      ? tls.connect(port, host, { rejectUnauthorized: false }, onConnect)
      : net.createConnection(port, host, onConnect);

    let data = '';
    socket.setTimeout(5000);

    function onConnect() {
      console.log(`[+] Connected to ${host}:${port} (TLS: ${useTls})`);
    }

    socket.on('data', (chunk) => {
      data += chunk.toString();
      socket.end();
      resolve({ success: true, banner: data.trim() });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ success: false, error: 'Timeout' });
    });

    socket.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}

async function run() {
  const host = 'mail.avyantrix.com';
  console.log(`Testing connectivity to ${host}...`);
  
  const smtp25 = await testPort(host, 25);
  console.log('Port 25 (SMTP):', smtp25);

  const smtp587 = await testPort(host, 587);
  console.log('Port 587 (Submission):', smtp587);

  const smtp465 = await testPort(host, 465, true);
  console.log('Port 465 (SMTPS):', smtp465);

  const httpRes = await fetch('https://mail.avyantrix.com', { redirect: 'manual' }).catch(e => ({ error: e.message }));
  if (httpRes.status) {
    console.log(`HTTPS https://${host} status:`, httpRes.status, httpRes.headers.get('location') || '');
  } else {
    console.log(`HTTPS https://${host} failed:`, httpRes.error);
  }
}

run();
