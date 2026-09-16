import { execSync } from 'child_process';

const propertyNames = [
  "secret",
  "secrets",
  "value",
  "hash",
  "passwordHash",
  "cleartext",
  "plain",
  "raw",
  "pass",
  "token"
];

for (const prop of propertyNames) {
  const payload = {
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
        [prop]: "AvyantrixNoReply2026!#Auth",
        allowedIps: {},
        expiresAt: null
      }
    }
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const encoded = Buffer.from(jsonStr).toString('base64');
  const bashScript = `
#!/usr/bin/env bash
echo '${encoded}' | base64 -d > /tmp/test_${prop}.json
/usr/local/bin/stalwart-cli --url http://127.0.0.1:8080 --user admin --password 'vk2auVLOKTz67BIpR1!' create Account/User --file /tmp/test_${prop}.json 2>&1
`;
  const bashEncoded = Buffer.from(bashScript).toString('base64');
  const cmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=no root@200.234.46.146 "echo '${bashEncoded}' | base64 -d | bash"`;
  try {
    const out = execSync(cmd, { encoding: 'utf-8' });
    console.log(`Property '${prop}':`, out.trim());
    if (out.includes("created") || !out.includes("error: invalidPatch")) {
      console.log(`>>> SUCCESS WITH PROPERTY: ${prop} <<<`);
      break;
    }
  } catch (err) {
    console.error(`Property '${prop}' failed:`, err.stdout || err.message);
  }
}
