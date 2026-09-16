import { execSync } from 'child_process';

const bashScript = `
#!/usr/bin/env bash
set -e
echo "Fetching latest stalwart-cli release..."
curl -sL https://github.com/stalwartlabs/mail-server/releases/download/v0.16.21/stalwart-cli-x86_64-unknown-linux-gnu.tar.gz -o /tmp/stalwart-cli.tar.gz || \
curl -sL https://github.com/stalwartlabs/mail-server/releases/latest/download/stalwart-cli-x86_64-unknown-linux-gnu.tar.gz -o /tmp/stalwart-cli.tar.gz

tar -xzf /tmp/stalwart-cli.tar.gz -C /usr/local/bin/ || tar -xzf /tmp/stalwart-cli.tar.gz -C /tmp/
chmod +x /usr/local/bin/stalwart-cli || chmod +x /tmp/stalwart-cli

/usr/local/bin/stalwart-cli --version || /tmp/stalwart-cli --version
`;

const encoded = Buffer.from(bashScript).toString('base64');
const cmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=no root@200.234.46.146 "echo '${encoded}' | base64 -d | bash"`;

try {
  const out = execSync(cmd, { encoding: 'utf-8' });
  console.log(out);
} catch (err) {
  console.error(err.stdout || err.message);
}
