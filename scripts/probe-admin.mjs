import { execSync } from 'child_process';

const pyCode = `
import urllib.request, base64

auth = base64.b64encode(b"admin:vk2auVLOKTz67BIpR1!").decode("ascii")

url = "http://172.18.0.2:8080/admin"
req = urllib.request.Request(url, headers={"Authorization": "Basic " + auth})
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8')
    print("--- /admin HTML ---")
    print(html[:1000])
`;

const encoded = Buffer.from(pyCode).toString('base64');
const cmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=no root@200.234.46.146 "python3 -c \\"import base64; exec(base64.b64decode('${encoded}').decode())\\""`;

try {
  const out = execSync(cmd, { encoding: 'utf-8' });
  console.log(out);
} catch (err) {
  console.error(err.stdout || err.message);
}
