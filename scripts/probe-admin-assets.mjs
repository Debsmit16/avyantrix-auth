import { execSync } from 'child_process';

const pyCode = `
import urllib.request, re

for asset in ['card-DphV-WMK.js', 'input-Cp-Bh3Ej.js', 'i18n-3qMLNo35.js', 'index-ep2ulFyd.js']:
    url = f"http://172.18.0.2:8080/admin/assets/{asset}"
    try:
        with urllib.request.urlopen(url) as resp:
            text = resp.read().decode('utf-8', errors='ignore')
            urls = set(re.findall(r'"(/[a-zA-Z0-9_\\-\\./]+)"', text))
            print(f"=== {asset} ({len(text)} bytes) ===")
            for u in sorted(urls):
                if len(u) > 2 and not u.endswith('.js') and not u.endswith('.css') and not u.endswith('.ico'):
                    print("  ", u)
    except Exception as e:
        print(f"{asset} error: {e}")
`;

const encoded = Buffer.from(pyCode).toString('base64');
const cmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=no root@200.234.46.146 "python3 -c \\"import base64; exec(base64.b64decode('${encoded}').decode())\\""`;

try {
  const out = execSync(cmd, { encoding: 'utf-8' });
  console.log(out);
} catch (err) {
  console.error(err.stdout || err.message);
}
