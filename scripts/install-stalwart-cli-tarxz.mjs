import { execSync } from 'child_process';

const bashScript = `
#!/usr/bin/env bash
set -e
echo "Downloading stalwart-cli v1.0.12 (x86_64)..."
curl -sL https://github.com/stalwartlabs/cli/releases/download/v1.0.12/stalwart-cli-x86_64-unknown-linux-gnu.tar.xz -o /tmp/stalwart-cli.tar.xz

mkdir -p /tmp/stalwart-cli-pkg
tar -xf /tmp/stalwart-cli.tar.xz -C /tmp/stalwart-cli-pkg/
cp /tmp/stalwart-cli-pkg/stalwart-cli /usr/local/bin/stalwart-cli
chmod +x /usr/local/bin/stalwart-cli

/usr/local/bin/stalwart-cli --help
`;

const encoded = Buffer.from(bashScript).toString('base64');
const cmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=no root@200.234.46.146 "echo '${encoded}' | base64 -d | bash"`;

try {
  const out = execSync(cmd, { encoding: 'utf-8' });
  console.log(out);
} catch (err) {
  console.error(err.stdout || err.message);
}
