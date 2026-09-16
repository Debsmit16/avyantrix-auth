import { execSync } from 'child_process';

const bashScript = `
#!/usr/bin/env bash
python3 -c '
import glob

passwords = [b"Debsmit@16112003", b"hs3fqjJzSURL4ZY5M1!", b"FtD6WEzA86bbxbPGM1!"]

for f in sorted(glob.glob("/var/lib/docker/volumes/avyantrix_stalwart_*/**", recursive=True)):
    try:
        with open(f, "rb") as fp:
            data = fp.read()
            for p in passwords:
                if p in data:
                    pos = data.find(p)
                    print(f"FOUND password in {f} at offset {pos}:")
                    start = max(0, pos - 150)
                    end = min(len(data), pos + 150)
                    print(data[start:end])
                    print("=" * 60)
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
