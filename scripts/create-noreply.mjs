import { execSync } from 'child_process';

const pyCode = `
import urllib.request, json, base64

auth = base64.b64encode(b"admin:vk2auVLOKTz67BIpR1!").decode("ascii")

jmap_url = "http://172.18.0.2:8080/jmap/"

req_body = {
  "using": [
    "urn:ietf:params:jmap:core",
    "urn:ietf:params:jmap:principals",
    "urn:stalwart:jmap"
  ],
  "methodCalls": [
    [
      "Principal/set",
      {
        "accountId": "d333333",
        "create": {
          "p1": {
            "type": "individual",
            "name": "noreply@avyantrix.com",
            "email": "noreply@avyantrix.com",
            "description": "Avyantrix Automated No-Reply System",
            "secrets": ["AvyantrixNoReply2026!#Auth"]
          }
        }
      },
      "call1"
    ]
  ]
}

req = urllib.request.Request(
  jmap_url,
  data=json.dumps(req_body).encode("utf-8"),
  headers={
    "Authorization": "Basic " + auth,
    "Content-Type": "application/json"
  }
)

try:
    with urllib.request.urlopen(req) as resp:
        print(resp.read().decode("utf-8"))
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")
`;

const encoded = Buffer.from(pyCode).toString('base64');
const cmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=no root@200.234.46.146 "python3 -c \\"import base64; exec(base64.b64decode('${encoded}').decode())\\""`;

try {
  const out = execSync(cmd, { encoding: 'utf-8' });
  console.log(out);
} catch (err) {
  console.error(err.stdout || err.message);
}
