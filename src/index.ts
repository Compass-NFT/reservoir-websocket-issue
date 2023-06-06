import axios from 'axios';
import WS from 'ws';

// You can get your API key from https://reservoir.tools
const YOUR_API_KEY = process.env.RESERVOIR_API_KEY;
const TEST_DURATION = 5 * 60 * 1000;
const wss = new WS(`wss://ws.reservoir.tools?api_key=${YOUR_API_KEY}`);

let startTimestamp = 0;
let endTimestamp = 0;
let websocketEventCount = 0;

async function getNumberOfEventsFromPolling() {
  let cursor = null;
  let count = 0;
  do {
    const result = await axios.get('https://api.reservoir.tools/orders/asks/v4', {
      headers: {
        'x-api-key': YOUR_API_KEY,
      },
      params: {
        limit: 1000,
        startTimestamp,
        endTimestamp,
        continuation: cursor,
      },
    });
    cursor = result.data.continuation;
    count += result.data.orders.length;
  } while (cursor !== null);

  return count;
}

wss.on('open', () => {
  console.log('Connected to Reservoir');

  wss.on('message', (rawData) => {
    const data = JSON.parse(rawData.toString());

    if (data.status === 'ready') {
      console.log('Subscribing');
      wss.send(
        JSON.stringify({
          type: 'subscribe',
          event: 'ask.created',
        }),
      );
    }

    if (data.event === 'ask.created') {
      if (startTimestamp === 0) {
        startTimestamp = Math.floor(Date.now() / 1000);
        setTimeout(async () => {
          wss.close();
          console.log('Closed connection to Reservoir');
          console.log(
            `Received ${websocketEventCount} events in ${endTimestamp - startTimestamp}s`,
          );
          console.log('Fetching events from API...');
          const count = await getNumberOfEventsFromPolling();
          console.log(`Received ${count} events from API (${(((count - websocketEventCount) / count) * 100).toFixed(2)}% missed)`);
        }, TEST_DURATION);
      }
      endTimestamp = Math.floor(Date.now() / 1000);
      websocketEventCount += 1;
    }
  });
});
