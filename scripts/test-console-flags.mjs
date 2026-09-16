import { execSync } from 'child_process';

const bashScript = `
#!/usr/bin/env bash
docker stop avy-stalwart-mail >/dev/null 2>&1
out=$(docker run -i --rm \
  -v avyantrix_stalwart_etc:/etc/stalwart \
  -v avyantrix_stalwart_data:/var/lib/stalwart \
  stalwartlabs/stalwart:v0.16.21 /usr/local/bin/stalwart -o -c /etc/stalwart/config.toml 2>&1)
docker start avy-stalwart-mail >/dev/null 2>&1
echo "$out"
`;

const encoded = Buffer.from(bashScript).toString('base64');
const cmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=no root@200.234.46.146 "echo '${encoded}' | base64 -d | bash"`;

try {
  const out = execSync(cmd, { encoding: 'utf-8' });
  console.log(out);
} catch (err) {
  console.error(err.stdout || err.message);
}
