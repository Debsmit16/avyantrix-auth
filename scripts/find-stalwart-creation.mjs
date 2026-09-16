import { execSync } from 'child_process';

const pyCode = `
import urllib.request, re

url = "http://172.18.0.2:8080/admin/assets/index-ep2ulFyd.js"
with urllib.request.urlopen(url) as resp:
    text = resp.read().decode('utf-8')
    # Let's search for "Principal" or "individual" or "secrets" or "emails" or "roles"
    keywords = ["Principal", "individual", "type", "secrets", "roles", "quota"]
    for kw in keywords:
        pos = 0
        print(f"=== Keyword: {kw} ===")
        count = 0
        while count < 3:
            idx = text.find(kw, pos)
            if idx == -1:
                break
            start = max(0, idx - 80)
            end = min(len(text), idx + 120)
            print(f"[{idx}]", text[start:end])
            pos = idx + len(kw)
            count += 1
`;

const encoded = Buffer.from(pyCode).toString('base64');
const cmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=no root@200.234.46.146 "python3 -c \\"import base64; exec(base64.b64decode('${encoded}').decode())\\""`;

try {
  const out = execSync(cmd, { encoding: 'utf-8' });
  console.log(out);
} catch (err) {
  console.error(err.stdout || err.message);
}
