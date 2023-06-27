import WS from 'ws';

// You can get your API key from https://reservoir.tools
const YOUR_API_KEY = process.env.RESERVOIR_API_KEY;
const wss = new WS(`wss://ws.reservoir.tools?api_key=${YOUR_API_KEY}`);

wss.on('open', () => {
  console.log('Connected to Reservoir');

  wss.on('message', (rawData) => {
    const data = JSON.parse(rawData.toString());

    if (data.status === 'ready') {
      console.log('Subscribing');
      wss.send(
        JSON.stringify({
          type: 'subscribe',
          event: 'bid.updated',
        }),
      );
    }

    if (data.event === 'bid.updated') {
      if (!data.data.criteria) {
        console.log('Criteria is null', data);
      }
    }
  });
});
