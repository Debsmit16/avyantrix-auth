import { execSync } from 'child_process';

const newCaddyfile = `{
    email admin@avyantrix.com
    log {
        output file /var/log/caddy/access.log {
            roll_size 50mb
            roll_keep 3
        }
    }
}

workspace.avyantrix.com {
    encode zstd gzip
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        X-Robots-Tag "noindex, nofollow"
        Referrer-Policy "strict-origin-when-cross-origin"
        -X-Powered-By
    }
    redir /.well-known/carddav /remote.php/dav 301
    redir /.well-known/caldav /remote.php/dav 301
    redir /.well-known/webfinger /index.php/.well-known/webfinger 301
    redir /.well-known/nodeinfo /index.php/.well-known/nodeinfo 301
    request_body {
        max_size 10GB
    }
    reverse_proxy nextcloud-app:80
}

mail.avyantrix.com, autoconfig.avyantrix.com {
    encode zstd gzip
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    reverse_proxy stalwart-mail:8080 {
        transport http {
            versions 1.1
        }
    }
}

status.avyantrix.com {
    encode zstd gzip
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
        X-Robots-Tag "noindex, nofollow"
    }
    reverse_proxy uptime-kuma:3001
}
`;

const encoded = Buffer.from(newCaddyfile).toString('base64');
const cmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=no root@200.234.46.146 "echo '${encoded}' | base64 -d > /opt/avyantrix/caddy/Caddyfile && docker restart avy-caddy"`;

try {
  const out = execSync(cmd, { encoding: 'utf-8' });
  console.log(out);
} catch (err) {
  console.error(err.stdout || err.message);
}
