# Pray for Wind

Pray for Wind is a lightweight wind forecast app for checking when the wind is strong enough to be worth getting outside, sailing, or just enjoying the coast. It is built around a simple idea: show local wind conditions clearly, fast, and without needing a backend or sign-in.

The project started as a personal weather tool for Åsa on the Swedish west coast, but it also supports custom coordinates anywhere in the covered forecast areas.

## What it does

- Shows hourly and multi-day wind forecasts
- Compares multiple forecast sources in one view
- Lets you set a custom location by latitude/longitude
- Displays a map view with animated wind field and forecast time slider
- Supports both metric units and knots
- Works as a client-side web app: the browser fetches the weather data directly
- Includes an optional CARTO basemap key for a darker map style

## Features

- Forecast chart with wind speed, gusts, and direction
- Table view for nearby forecast times at a chosen step size
- Map view with model selection (DMI, MET Nordic, ECMWF)
- Animated wind overlay over the map
- Dark/light map styles and custom location selection
- No server-side data storage or account setup required

## Project purpose

This app is designed to answer a simple question: "Is it windy enough that it matters right now?"

It is intentionally kept focused and easy to use, with a clean interface and minimal setup. The project is a practical hobby app rather than a full weather platform.

## Run locally

Because the app is static, you can run it with any simple local web server.

1. Clone the repository
2. Open a terminal in the project folder
3. Start a local server:

```bash
python3 -m http.server 8000
```

4. Open your browser at:

```text
http://localhost:8000
```

You can also open `index.html` directly in a browser, though a local web server is recommended for smoother behavior and consistent asset loading.

## Optional configuration

A sample configuration file is included as `config.example.js`.

```bash
cp config.example.js config.js
```

Then edit `config.js` to add your CARTO basemap key if you want to use the optional dark map style. The file is gitignored and intended to stay private.

## Data sources

This project uses public forecast data from weather services such as Open-Meteo, DMI, MET Norway, ECMWF, and SMHI. The app processes and visualizes those values on the client side.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Notes

This project is a personal hobby tool and should not be treated as a safety-critical weather system. It is useful for planning and situational awareness, but operational decisions at sea or in other hazardous conditions should rely on official weather guidance and local forecasts.
