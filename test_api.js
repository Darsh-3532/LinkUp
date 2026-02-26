const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/network',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('API Test Results:');
      console.log('Success:', json.success);
      if (json.data) {
        console.log('Nodes:', json.data.nodes.length);
        console.log('Edges:', json.data.edges.length);
      }
    } catch (e) {
      console.log('Error parsing response:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.log('Request error:', e.message);
});

req.setTimeout(5000, () => {
  console.log('Request timeout');
  req.destroy();
});

req.end();
