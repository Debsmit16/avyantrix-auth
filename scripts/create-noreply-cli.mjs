import { execSync } from 'child_process';

const payload = {
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
      secret: "AvyantrixNoReply2026!#Auth",
      allowedIps: [],
      expiresAt: null
    }
  ]
};

const jsonStr = JSON.stringify(payload, null, 2);
const encoded = Buffer.from(jsonStr).toString('base64');

const bashScript = `
#!/usr/bin/env bash
echo '${encoded}' | base64 -d > /tmp/noreply.json
cat /tmp/noreply.json
/usr/local/bin/stalwart-cli --url http://127.0.0.1:8080 --user admin --password 'vk2auVLOKTz67BIpR1!' --debug create Account/User --file /tmp/noreply.json
`;

const bashEncoded = Buffer.from(bashScript).toString('base64');
const cmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=no root@200.234.46.146 "echo '${bashEncoded}' | base64 -d | bash"`;

try {
  const out = execSync(cmd, { encoding: 'utf-8' });
  console.log(out);
} catch (err) {
  console.error(err.stdout || err.message);
}
