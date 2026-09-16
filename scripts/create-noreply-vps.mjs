import { execSync } from 'child_process';

const bashScript = `
#!/usr/bin/env bash
set -e
pass='AvyantrixNoReply2026!#Auth'
payload='{"type":"individual","name":"noreply","secrets":["'"$pass"'"],"emails":["noreply@avyantrix.com"],"roles":["user"]}'

echo "Trying with STALWART_ADMIN_PASSWORD..."
curl -i -X POST -H 'Content-Type: application/json' -u 'admin:8dUpcFFSmBZBZUquB2!' -d "$payload" http://172.18.0.2:8080/api/principal || true

echo "Trying with STALWART_RECOVERY_ADMIN..."
curl -i -X POST -H 'Content-Type: application/json' -u 'admin:vk2auVLOKTz67BIpR1!' -d "$payload" http://172.18.0.2:8080/api/principal || true
`;

const encoded = Buffer.from(bashScript).toString('base64');
const cmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=no root@200.234.46.146 "echo '${encoded}' | base64 -d | bash"`;

try {
  const out = execSync(cmd, { encoding: 'utf-8' });
  console.log(out);
} catch (err) {
  console.error(err.stdout || err.message);
}
