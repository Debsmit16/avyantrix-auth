import { execSync } from 'child_process';

const pyCode = `
import urllib.request

url = "http://172.18.0.2:8080/api/discover/admin"
req = urllib.request.Request(url)
with urllib.request.urlopen(req) as resp:
    print(resp.read().decode('utf-8'))
`;

const encoded = Buffer.from(pyCode).toString('base64');
const cmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=no root@200.234.46.146 "python3 -c \\"import base64; exec(base64.b64decode('${encoded}').decode())\\""`;

try {
  const out = execSync(cmd, { encoding: 'utf-8' });
  console.log(out);
} catch (err) {
  console.error(err.stdout || err.message);
}
