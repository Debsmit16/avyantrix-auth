import net from 'net';

function testPort(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection(port, host);
    socket.setTimeout(3000);
    socket.on('connect', () => {
      console.log(`Port ${port} on ${host} is OPEN!`);
      socket.end();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      console.log(`Port ${port} on ${host} TIMED OUT`);
      resolve(false);
    });
    socket.on('error', (err) => {
      console.log(`Port ${port} on ${host} ERROR: ${err.message}`);
      resolve(false);
    });
  });
}

async function main() {
  const ports = [80, 443, 8080, 4190, 25, 465, 587, 993, 995, 3001, 5432, 6379];
  for (const p of ports) {
    await testPort('200.234.46.146', p);
  }
}

main();
