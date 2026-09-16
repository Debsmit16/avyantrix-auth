import { execSync } from 'child_process';

const pyCode = `
import urllib.request, re

url = "http://172.18.0.2:8080/admin/assets/index-ep2ulFyd.js"
with urllib.request.urlopen(url) as resp:
    js = resp.read().decode("utf-8")
    print("JS bundle size:", len(js))
    # find all methodCalls patterns or endpoints
    matches = re.findall(r'([A-Za-z0-9]+/(?:get|set|query|changes|create|update|delete))', js)
    print("Matched JMAP methods:", sorted(list(set(matches))))
`;

const encoded = Buffer.from(pyCode).toString('base64');
const cmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=no root@200.234.46.146 "python3 -c \\"import base64; exec(base64.b64decode('${encoded}').decode())\\""`;

try {
  const out = execSync(cmd, { encoding: 'utf-8' });
  console.log(out);
} catch (err) {
  console.error(err.stdout || err.message);
}
