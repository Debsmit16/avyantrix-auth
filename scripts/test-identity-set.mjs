import { execSync } from 'child_process';

const bashScript = `
#!/usr/bin/env bash
curl -s -X POST http://172.18.0.2:8080/jmap/ \
  -H "Authorization: Basic $(echo -n 'admin:vk2auVLOKTz67BIpR1!' | base64)" \
  -H "Content-Type: application/json" \
  -d '{
    "using": [
      "urn:ietf:params:jmap:core",
      "urn:ietf:params:jmap:submission"
    ],
    "methodCalls": [
      [
        "Identity/set",
        {
          "accountId": "d333333",
          "create": {
            "id_noreply": {
              "name": "Avyantrix Identity",
              "email": "noreply@avyantrix.com"
            }
          }
        },
        "c1"
      ]
    ]
  }'
`;

const encoded = Buffer.from(bashScript).toString('base64');
const cmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=no root@200.234.46.146 "echo '${encoded}' | base64 -d | bash"`;

try {
  const out = execSync(cmd, { encoding: 'utf-8' });
  console.log(out);
} catch (err) {
  console.error(err.stdout || err.message);
}
