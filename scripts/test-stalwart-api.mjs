import http from 'http';
import https from 'https';

async function testApiEndpoint(url, headers = {}) {
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from('admin:vk2auVLOKTz67BIpR1!').toString('base64'),
        ...headers,
      },
    });
    console.log(`[${res.status}] ${url}`);
    const text = await res.text();
    console.log(`Response snippet (${text.length} bytes):`, text.substring(0, 300));
    return { status: res.status, text };
  } catch (err) {
    console.log(`[ERR] ${url} -> ${err.message}`);
    return { error: err.message };
  }
}

async function run() {
  const baseUrls = [
    'https://mail.avyantrix.com/api',
    'https://mail.avyantrix.com/api/principals',
    'https://mail.avyantrix.com/api/directory/principals',
    'https://mail.avyantrix.com/api/domains',
    'https://mail.avyantrix.com/jmap',
    'https://mail.avyantrix.com/.well-known/jmap',
    'https://mail.avyantrix.com/admin',
    'https://workspace.avyantrix.com',
  ];

  for (const u of baseUrls) {
    await testApiEndpoint(u);
  }
}

run();
