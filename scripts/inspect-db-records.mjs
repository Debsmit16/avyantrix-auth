import { execSync } from 'child_process';

const bashScript = `
#!/usr/bin/env bash
python3 -c '
import glob

for f in sorted(glob.glob("/var/lib/docker/volumes/avyantrix_stalwart_data/_data/*")):
    try:
        with open(f, "rb") as fp:
            data = fp.read()
            idx = 0
            while True:
                pos = data.find(b"hello@avyantrix.com", idx)
                if pos == -1:
                    break
                start = max(0, pos - 100)
                end = min(len(data), pos + 100)
                print(f"File {f} at offset {pos}:")
                print(data[start:end])
                print("-" * 40)
                idx = pos + 20
    except Exception as e:
        pass
'
`;

const encoded = Buffer.from(bashScript).toString('base64');
const cmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=no root@200.234.46.146 "echo '${encoded}' | base64 -d | bash"`;

try {
  const out = execSync(cmd, { encoding: 'utf-8' });
  console.log(out);
} catch (err) {
  console.error(err.stdout || err.message);
}
