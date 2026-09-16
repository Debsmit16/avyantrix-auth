import { execSync } from 'child_process';

const pyCode = `
import urllib.request, json, base64

auth = base64.b64encode(b"admin:vk2auVLOKTz67BIpR1!").decode("ascii")

jmap_url = "http://172.18.0.2:8080/jmap/"

# Let's inspect the details of existing principals to see full schema
req_body = {
  "using": [
    "urn:ietf:params:jmap:core",
    "urn:ietf:params:jmap:principals",
    "urn:stalwart:jmap"
  ],
  "methodCalls": [
    ["Principal/get", {"accountId": "d333333", "ids": ["b", "f", "i"]}, "c1"]
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

with urllib.request.urlopen(req) as resp:
    print(resp.read().decode("utf-8"))
`;

const encoded = Buffer.from(pyCode).toString('base64');
const cmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=no root@200.234.46.146 "python3 -c \\"import base64; exec(base64.b64decode('${encoded}').decode())\\""`;

try {
  const out = execSync(cmd, { encoding: 'utf-8' });
  console.log(out);
} catch (err) {
  console.error(err.stdout || err.message);
}
