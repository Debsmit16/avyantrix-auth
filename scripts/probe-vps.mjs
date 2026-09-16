import { execSync } from 'child_process';

const pyCode = `
import urllib.request, base64

auth = base64.b64encode(b"admin:vk2auVLOKTz67BIpR1!").decode("ascii")
endpoints = [
  "/api", 
  "/api/principal", 
  "/api/principals", 
  "/api/v1/principals", 
  "/api/directory/principal", 
  "/account", 
  "/account/login", 
  "/jmap", 
  "/.well-known/jmap", 
  "/admin"
]

for ep in endpoints:
    url = "http://172.18.0.2:8080" + ep
    req = urllib.request.Request(url, headers={"Authorization": "Basic " + auth})
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"[{resp.status}] {ep}")
    except urllib.error.HTTPError as e:
        print(f"[{e.code}] {ep}: {e.read().decode('utf-8', errors='ignore')[:100]}")
    except Exception as e:
        print(f"[ERR] {ep}: {e}")
`;

const encoded = Buffer.from(pyCode).toString('base64');
const cmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=no root@200.234.46.146 "python3 -c \\"import base64; exec(base64.b64decode('${encoded}').decode())\\""`;

try {
  const out = execSync(cmd, { encoding: 'utf-8' });
  console.log(out);
} catch (err) {
  console.error(err.stdout || err.message);
}
