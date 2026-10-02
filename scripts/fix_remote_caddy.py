import subprocess

# 1. Fetch current Caddyfile
fetch_proc = subprocess.run(["ssh", "root@200.234.46.146", "cat /opt/avyantrix/caddy/Caddyfile"], capture_output=True, text=True)
caddyfile = fetch_proc.stdout

print("Fetched Caddyfile length:", len(caddyfile))

# 2. Fix Stalwart proxy block
old_block = """mail.avyantrix.com, autoconfig.avyantrix.com {
    encode zstd gzip
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    reverse_proxy http://stalwart-mail:8080 {
        transport http {
            tls_insecure_skip_verify
        }
    }
}"""

new_block = """mail.avyantrix.com, autoconfig.avyantrix.com {
    encode zstd gzip
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    reverse_proxy stalwart-mail:8080
}"""

if old_block in caddyfile:
    caddyfile = caddyfile.replace(old_block, new_block)
    print("Replaced old block with new plain reverse_proxy")
else:
    # Try alternate if http: was already modified
    import re
    caddyfile = re.sub(
        r'reverse_proxy http[s]?://stalwart-mail:8080\s*\{[\s\S]*?\}',
        'reverse_proxy stalwart-mail:8080',
        caddyfile
    )
    print("Regex replaced block")

# 3. Write back using ssh stdin
write_proc = subprocess.Popen(["ssh", "root@200.234.46.146", "cat > /opt/avyantrix/caddy/Caddyfile"], stdin=subprocess.PIPE, text=True)
write_proc.communicate(input=caddyfile)
print("Write exit code:", write_proc.returncode)

# 4. Reload Caddy
reload_proc = subprocess.run(["ssh", "root@200.234.46.146", "docker exec avy-caddy caddy reload --config /etc/caddy/Caddyfile"], capture_output=True, text=True)
print("Caddy reload output:", reload_proc.stdout, reload_proc.stderr)
