import { execSync } from 'child_process';

const bashScript = `
#!/usr/bin/env bash
curl -i -s http://172.18.0.2:8080/.well-known/jmap \
  -H "Authorization: Basic $(echo -n 'hr@avyantrix.com:Debsmit@16112003' | base64)"
`;

const encoded = Buffer.from(bashScript).toString('base64');
const cmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=no root@200.234.46.146 "echo '${encoded}' | base64 -d | bash"`;

try {
  const out = execSync(cmd, { encoding: 'utf-8' });
  console.log(out);
} catch (err) {
  console.error(err.stdout || err.message);
}
