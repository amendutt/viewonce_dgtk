import L from "leaflet";

// In-memory cache for reverse geocoding to avoid duplicate network requests
const geocodeCache = new Map();

/**
 * Resolves the exact area / locality name for given coordinates
 */
export async function getExactAreaName(lat, lng) {
  if (!lat || !lng) return "";
  const key = `${Number(lat).toFixed(3)},${Number(lng).toFixed(3)}`;
  if (geocodeCache.has(key)) return geocodeCache.get(key);

  try {
    // 1. Fast, free BigDataCloud client-side reverse geocoding
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    if (res.ok) {
      const data = await res.json();
      const parts = [];
      if (data.locality && data.locality !== data.city) parts.push(data.locality);
      if (data.city) parts.push(data.city);
      else if (data.principalSubdivision) parts.push(data.principalSubdivision);

      const area = parts.join(", ") || data.locality || data.city || data.principalSubdivision || "";
      if (area) {
        geocodeCache.set(key, area);
        return area;
      }
    }
  } catch (err) {
    // Fallback if network blocked
  }

  try {
    // 2. OpenStreetMap Nominatim reverse geocode fallback
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`,
      { headers: { "Accept-Language": "en" } }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const area =
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.city_district ||
        addr.town ||
        addr.city ||
        addr.road ||
        "";
      if (area) {
        geocodeCache.set(key, area);
        return area;
      }
    }
  } catch (err) {
    // Graceful fallback
  }

  return "";
}

/**
 * Fetches nearby famous areas, localities, and landmarks within a radius (meters)
 */
export async function fetchNearbyFamousPlaces(lat, lng, radius = 9000) {
  if (!lat || !lng) return [];
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lng}&gsradius=${radius}&gslimit=16&format=json&origin=*`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const items = data?.query?.geosearch || [];

    // Filter and sanitize places
    return items
      .map((item) => ({
        name: item.title,
        lat: item.lat,
        lng: item.lon,
        dist: Math.round(item.dist),
      }))
      .filter((p) => p.name && !p.name.includes("constituency"));
  } catch (err) {
    console.warn("Famous places fetch failed:", err);
    return [];
  }
}

/**
 * Creates an elegant, lightweight pill label for famous places and landmarks
 */
export function makeFamousPlaceIcon(name, dist) {
  let icon = "📍";
  const lower = name.toLowerCase();

  if (lower.includes("college") || lower.includes("university") || lower.includes("vidyalaya") || lower.includes("school") || lower.includes("institute") || lower.includes("education")) {
    icon = "🎓";
  } else if (lower.includes("station") || lower.includes("junction") || lower.includes("railway")) {
    icon = "🚉";
  } else if (lower.includes("hospital") || lower.includes("medical") || lower.includes("clinic")) {
    icon = "🏥";
  } else if (lower.includes("park") || lower.includes("garden") || lower.includes("lake") || lower.includes("talab")) {
    icon = "🌳";
  } else if (lower.includes("temple") || lower.includes("masjid") || lower.includes("church") || lower.includes("mandir")) {
    icon = "🏛️";
  } else if (lower.includes("bazar") || lower.includes("market") || lower.includes("mandi") || lower.includes("chowk")) {
    icon = "🛍️";
  }

  // Clean name up by removing trailing province/city suffix if repetitive
  const cleanName = name.replace(/,\s*(Raebareli|Uttar Pradesh|India).*$/i, "").trim();

  return L.divIcon({
    className: "",
    iconAnchor: [12, 12],
    html: `
      <div style="
        display:inline-flex;align-items:center;gap:4.5px;
        background:rgba(255, 255, 255, 0.94);
        color:#1e293b;
        padding:3px 9px;border-radius:20px;
        font-size:10.5px;font-weight:600;font-family:system-ui,-apple-system,sans-serif;
        border:1px solid #cbd5e1;
        box-shadow:0 2px 7px rgba(0,0,0,0.12);
        white-space:nowrap;
        pointer-events:auto;
        cursor:default;
        backdrop-filter:blur(6px);
        transition:transform 0.15s ease;
      "
      onmouseover="this.style.transform='scale(1.08)';this.style.zIndex='9999';"
      onmouseout="this.style.transform='scale(1)';"
      title="${name}${dist ? ' · ' + dist + 'm away' : ''}">
        <span style="font-size:11px;line-height:1;">${icon}</span>
        <span style="line-height:1.2;">${cleanName}</span>
      </div>
    `,
  });
}
