import { execSync } from 'child_process';

const pyCode = `
import urllib.request

url = "http://172.18.0.2:8080/admin/assets/index-ep2ulFyd.js"
with urllib.request.urlopen(url) as resp:
    text = resp.read().decode('utf-8')
    idx = 0
    while True:
        pos = text.find('fetch(', idx)
        if pos == -1:
            break
        start = max(0, pos - 100)
        end = min(len(text), pos + 250)
        print("FETCH SNIPPET:", text[start:end])
        print("-" * 50)
        idx = pos + 6
`;

const encoded = Buffer.from(pyCode).toString('base64');
const cmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=no root@200.234.46.146 "python3 -c \\"import base64; exec(base64.b64decode('${encoded}').decode())\\""`;

try {
  const out = execSync(cmd, { encoding: 'utf-8' });
  console.log(out);
} catch (err) {
  console.error(err.stdout || err.message);
}
