import { execSync } from 'child_process';

const bashScript = `
#!/usr/bin/env bash
set -e
cd /opt/avyantrix

# Add port 8080 if not present
if ! grep -q '8080:8080' docker-compose.yml; then
  sed -i '/"4190:4190"/a \\      - "127.0.0.1:8080:8080"' docker-compose.yml
fi

docker compose up -d
sleep 3
curl -s -u admin:vk2auVLOKTz67BIpR1! http://127.0.0.1:8080/.well-known/jmap | head -c 100
`;

const encoded = Buffer.from(bashScript).toString('base64');
const cmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=no root@200.234.46.146 "echo '${encoded}' | base64 -d | bash"`;

try {
  const out = execSync(cmd, { encoding: 'utf-8' });
  console.log(out);
} catch (err) {
  console.error(err.stdout || err.message);
}
