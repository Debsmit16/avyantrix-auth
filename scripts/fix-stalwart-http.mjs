import { execSync } from 'child_process';

const bashScript = `
#!/usr/bin/env bash
CONFIG_FILE="/var/lib/docker/volumes/avyantrix_stalwart_etc/_data/config.toml"

sed -i '/\\[server.listener.http\\]/,/\\[/ { s/protocol = "http"/protocol = "http"\\ntls.enable = false\\ntls.implicit = false/ }' "$CONFIG_FILE"

docker restart avy-stalwart-mail
sleep 3
`;

const encoded = Buffer.from(bashScript).toString('base64');
const cmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=no root@200.234.46.146 "echo '${encoded}' | base64 -d | bash"`;

try {
  const out = execSync(cmd, { encoding: 'utf-8' });
  console.log(out);
} catch (err) {
  console.error(err.stdout || err.message);
}
