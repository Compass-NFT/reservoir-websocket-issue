## Demo showing missing events from websocket
The script will listen for ask.created event and count all events it receives during the test. After that it will fetch all asks from the Reservoir API between the test start and end timestamps and compares the count.
Tweak `TEST_DURATION` in index.js to change the duration of the test.

### Running the demo

1. Clone repo
2. Install dependencies
```
$ yarn
```
3. Run script
```
$ yarn dev
```


 
