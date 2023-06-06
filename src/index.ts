import axios from 'axios';
import WS from 'ws';

// You can get your API key from https://reservoir.tools
const YOUR_API_KEY = process.env.RESERVOIR_API_KEY;
const TEST_DURATION = 2 * 60 * 1000;
const wss = new WS(`wss://ws.reservoir.tools?api_key=${YOUR_API_KEY}`);

let startTimestamp = 0;
let endTimestamp = 0;
let websocketEventCount = 0;

const websocketOrderIds = new Set();
const websocketMissedIds = new Set();

async function getNumberOfEventsFromPolling() {
  let cursor = null;
  let count = 0;
  let ids: string[] = [];
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
    ids = [...ids, ...result.data.orders.map((order) => order.id)];
  } while (cursor !== null);

  ids.forEach((id) => {
    if (!websocketOrderIds.has(id)) {
      websocketMissedIds.add(id);
    }
  });

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
      const ts = Math.floor(new Date(data.data.createdAt).getTime() / 1000);

      if (startTimestamp === 0) {
        startTimestamp = ts;
        setTimeout(async () => {
          wss.close();
          console.log('Closed connection to Reservoir');
          console.log('startTimestamp', startTimestamp);
          console.log('endTimestamp', endTimestamp);
          console.log(
            `Received ${websocketEventCount} events in ${endTimestamp - startTimestamp}s`,
          );
          console.log('Fetching events from API...');
          const count = await getNumberOfEventsFromPolling();
          console.log(`Received ${count} events from API (${(((count - websocketEventCount) / count) * 100).toFixed(2)}% missed)`);
          console.log(`Missed ${websocketMissedIds.size} events from API`);
          console.log('Missed events:');
          console.log(websocketMissedIds.values());
        }, TEST_DURATION);
      }
      if (ts > endTimestamp) {
        endTimestamp = ts;
      }

      websocketEventCount += 1;
      websocketOrderIds.add(data.data.id);
    }
  });
});
