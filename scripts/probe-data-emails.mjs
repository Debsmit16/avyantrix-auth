import { execSync } from 'child_process';

const bashScript = `
#!/usr/bin/env bash
grep -a -o -E '[a-zA-Z0-9._%+-]+@avyantrix.com' /var/lib/docker/volumes/avyantrix_stalwart_data/_data/* | sort -u
`;

const encoded = Buffer.from(bashScript).toString('base64');
const cmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=no root@200.234.46.146 "echo '${encoded}' | base64 -d | bash"`;

try {
  const out = execSync(cmd, { encoding: 'utf-8' });
  console.log(out);
} catch (err) {
  console.error(err.stdout || err.message);
}
