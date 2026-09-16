import { execSync } from 'child_process';

const payloads = [
  {
    name: "noreply",
    domainId: "b",
    description: "Avyantrix Automated No-Reply System",
    locale: "en-US",
    roles: { "@type": "User" },
    permissions: { "@type": "Inherit" },
    encryptionAtRest: { "@type": "Disabled" },
    credentials: {
      "0": {
        "@type": "Password",
        "password": "AvyantrixNoReply2026!#Auth",
        "allowedIps": {},
        "expiresAt": null
      }
    }
  },
  {
    name: "noreply",
    domainId: "b",
    description: "Avyantrix Automated No-Reply System",
    locale: "en-US",
    roles: { "@type": "User" },
    permissions: { "@type": "Inherit" },
    encryptionAtRest: { "@type": "Disabled" },
    credentials: [
      {
        "@type": "Password",
        "password": "AvyantrixNoReply2026!#Auth"
      }
    ]
  }
];

for (let i = 0; i < payloads.length; i++) {
  const jsonStr = JSON.stringify(payloads[i], null, 2);
  const encoded = Buffer.from(jsonStr).toString('base64');
  const bashScript = `
#!/usr/bin/env bash
echo '${encoded}' | base64 -d > /tmp/noreply_${i}.json
/usr/local/bin/stalwart-cli --url http://127.0.0.1:8080 --user admin --password 'vk2auVLOKTz67BIpR1!' create Account/User --file /tmp/noreply_${i}.json || true
`;
  const bashEncoded = Buffer.from(bashScript).toString('base64');
  const cmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=no root@200.234.46.146 "echo '${bashEncoded}' | base64 -d | bash"`;
  console.log(`--- Testing Payload ${i} ---`);
  try {
    const out = execSync(cmd, { encoding: 'utf-8' });
    console.log(out);
  } catch (err) {
    console.error(err.stdout || err.message);
  }
}
