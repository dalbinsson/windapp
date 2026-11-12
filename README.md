# windapp

Wind forecast app for checking local wind conditions; MIT licensed.

## What it does

- Shows hourly and multi-day wind forecasts
- Compares forecasts from multiple weather sources
- Lets you choose a location using coordinates or your device location
- Provides forecast charts, a table, and an interactive wind map
- Displays wind speed in meters per second or knots

## Run locally

This is a static web app. Clone the repository, open a terminal in the project folder, and start a local web server:

```bash
python3 -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000).

## Optional map configuration

To use a CARTO basemap key, copy the example configuration and add your key:

```bash
cp config.example.js config.js
```

Edit `config.js` with your key. This file is gitignored and stays local to your copy of the project. The app also offers map styles that do not require a key.

## Data and safety

Forecast data is fetched directly by the browser from the weather services listed in the app. Forecasts can be incomplete or unavailable for some locations. This hobby app is not a safety-critical weather service; rely on official forecasts for decisions at sea or in hazardous conditions.

## License

MIT. See [LICENSE](LICENSE).
