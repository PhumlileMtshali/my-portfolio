/* ------------- 7-Day forecast logic (Open-Meteo + Nominatim) ------------- */
document.addEventListener("DOMContentLoaded", () => {
  const locationHeading = document.getElementById("location");
  const forecastGrid = document.getElementById("forecast");
  const form = document.getElementById("search-form");
  const input = document.getElementById("search-input");

  /* Map Open-Meteo weather codes to quick emoji icons */
  const icons = {
    0: "☀️",
    1: "🌤️",
    2: "⛅",
    3: "☁️",
    45: "🌫️",
    48: "🌫️",
    51: "🌦️",
    53: "🌦️",
    55: "🌧️",
    56: "🌧️",
    57: "🌧️",
    61: "🌦️",
    63: "🌧️",
    65: "🌧️",
    66: "🌧️",
    67: "🌧️",
    71: "❄️",
    73: "❄️",
    75: "❄️",
    77: "❄️",
    80: "🌦️",
    81: "🌧️",
    82: "🌧️",
    95: "⛈️",
    96: "⛈️",
    99: "⛈️",
  };

  /* Helper: fetch daily weather + render */
  function getWeather(lat, lon, placeLabel = "Your location") {
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`
    )
      .then((r) => r.json())
      .then((data) => {
        locationHeading.textContent = placeLabel;
        forecastGrid.innerHTML = data.daily.time
          .map((iso, i) => {
            const date = new Date(iso).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
            const max = Math.round(data.daily.temperature_2m_max[i]);
            const min = Math.round(data.daily.temperature_2m_min[i]);
            const icon = icons[data.daily.weathercode[i]] || "❓";
            return `
              <div class="day-card">
                <div class="icon">${icon}</div>
                <div class="date">${date}</div>
                <div class="temp">${max}° / ${min}°C</div>
              </div>`;
          })
          .join("");
      })
      .catch(() => {
        locationHeading.textContent = "Unable to load forecast 😞";
        forecastGrid.innerHTML = "";
      });
  }

  /* Helper: forward-geocode any place name → lat/lon */
  function geocode(place) {
    return fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        place
      )}&limit=1`
    )
      .then((r) => r.json())
      .then((results) => (results[0] ? results[0] : null));
  }

  /* Start with the user’s current GPS position (if permitted) */
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        /* Reverse-geocode once for a friendly label */
        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        )
          .then((r) => r.json())
          .then((addr) => {
            const label =
              addr.address.city ||
              addr.address.town ||
              addr.address.village ||
              addr.address.state ||
              "Your location";
            getWeather(latitude, longitude, label);
          })
          .catch(() => getWeather(latitude, longitude));
      },
      /* If user denies or geolocation fails, fall back to a default city */
      () => geocode("Johannesburg").then((loc) =>
        getWeather(loc.lat, loc.lon, "Johannesburg")
      )
    );
  }

  /* Search form handler */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;
    geocode(query).then((loc) => {
      if (!loc) {
        alert("Place not found – try another search term.");
        return;
      }
      getWeather(loc.lat, loc.lon, loc.display_name.split(",")[0]);
      form.reset();
    });
  });
});
