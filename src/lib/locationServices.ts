export interface NearbyService {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  distance: string;
  distanceKm: number;
  type: string;
  phone?: string;
}

// Simple in-memory cache so repeated searches for the same area
// don't keep hammering the Overpass API from a single client.
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const searchCache = new Map<
  string,
  {
    timestamp: number;
    data: NearbyService[];
  }
>();

function buildCacheKey(
  lat: number,
  lon: number,
  category: string | undefined,
  query: string | undefined,
  radiusKm: number
): string {
  const keyLat = lat.toFixed(3);
  const keyLon = lon.toFixed(3);
  const cat = category || "all";
  const q = (query || "").trim().toLowerCase();
  return `${keyLat}:${keyLon}:${cat}:${q}:${radiusKm}`;
}

// Calculate distance between two coordinates in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

export async function searchNearbyRepairServices(
  lat: number,
  lon: number,
  category?: string,
  query?: string,
  radiusKm: number = 20
): Promise<NearbyService[]> {
  try {
    const cacheKey = buildCacheKey(lat, lon, category, query, radiusKm);
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
    // Search for repair-related amenities using Overpass API
    // Use 25 km radius
    const searchRadius = Math.max(1000, Math.min(radiusKm * 1000, 40000)); // clamp between 1km and 40km
    
    // Build query for different repair service types
    const repairTypes = [
      'shop=electronics',
      'shop=mobile_phone',
      'shop=computer',
      'shop=car_repair',
      'amenity=car_repair',
      'craft=electronics_repair',
      'craft=tailor',
      'craft=shoemaker',
      'shop=bicycle',
      'amenity=bicycle_repair_station',
      'shop=appliance',
      'craft=watchmaker',
      'shop=hardware',
    ];
    
    // For better coverage include nodes, ways and relations
    const typeQueries = repairTypes.map((type) => {
      return (
        `node[${type}](around:${searchRadius},${lat},${lon});` +
        `way[${type}](around:${searchRadius},${lat},${lon});` +
        `relation[${type}](around:${searchRadius},${lat},${lon});`
      );
    }).join('');
    
    const overpassQuery = `
      [out:json][timeout:40];
      (
        ${typeQueries}
      );
      out body center;
    `;

    // Try multiple Overpass endpoints with retries and exponential backoff to avoid 429 errors
    const overpassEndpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
      'https://overpass.openstreetmap.fr/api/interpreter',
    ];

    async function fetchOverpassWithRetries(query: string) {
      let lastError: any = null;
      const maxAttempts = 6; // total attempts across endpoints
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const endpoint = overpassEndpoints[attempt % overpassEndpoints.length];
        try {
          const resp = await fetch(endpoint, {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json',
            },
          });

          if (resp.status === 429) {
            // rate limited, backoff and try next endpoint/attempt
            lastError = new Error('Rate limited by Overpass endpoint (429)');
            const backoffMs = Math.min(500 * Math.pow(2, attempt), 10000);
            console.warn(`Overpass 429 on ${endpoint}, backing off ${backoffMs}ms (attempt ${attempt + 1})`);
            await new Promise((r) => setTimeout(r, backoffMs));
            continue;
          }

          if (!resp.ok) {
            lastError = new Error(`Overpass request failed with status ${resp.status}`);
            // short delay before next attempt
            await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
            continue;
          }

          return resp;
        } catch (err) {
          lastError = err;
          const backoffMs = Math.min(400 * Math.pow(2, attempt), 10000);
          console.warn(`Overpass fetch error for ${endpoint}:`, err, `(attempt ${attempt + 1}), retrying in ${backoffMs}ms`);
          await new Promise((r) => setTimeout(r, backoffMs));
          continue;
        }
      }
      throw lastError || new Error('Failed to fetch from Overpass after retries');
    }

    const response = await fetchOverpassWithRetries(overpassQuery);

    if (!response.ok) {
      throw new Error('Failed to fetch nearby services');
    }

    const data = await response.json();
    
    const rawServices = data.elements
      .filter((el: any) => el.tags?.name)
      .map((el: any) => {
        const elLat = el.lat ?? el.center?.lat;
        const elLon = el.lon ?? el.center?.lon;
        if (typeof elLat !== 'number' || typeof elLon !== 'number') return null;

        const tags = el.tags || {};
        const distance = calculateDistance(lat, lon, elLat, elLon);

        // Determine a primary type tag
        const primaryType = tags.craft || tags.amenity || tags.shop || '';

        return {
          id: `osm-${el.id}`,
          name: tags.name,
          address: [
            tags['addr:street'],
            tags['addr:housenumber'],
            tags['addr:city'],
          ]
            .filter(Boolean)
            .join(' ') || 'Address not available',
          lat: elLat,
          lon: elLon,
          distance: formatDistance(distance),
          distanceKm: distance,
          type: primaryType || 'repair',
          phone: tags.phone || tags['contact:phone'],
          _tags: tags, // keep original tags for filtering
        } as NearbyService | null;
      })
      .filter(Boolean) as (NearbyService & { _tags?: any })[];

    // Strict repair filter - prefer craft/amenity repair tags, or names containing repair keywords
    const repairKeywords = ['repair', 'service', 'clinic', 'fix', 'workshop', 'station', 'center', 'servicecenter', 'service center'];

    function looksLikeRepair(item: NearbyService & { _tags?: any }) {
      const tags = item._tags || {};
      const name = (item.name || '').toLowerCase();
      const primary = (item.type || '').toLowerCase();

      // If craft explicitly indicates repair, accept
      if (tags.craft && tags.craft.toLowerCase().includes('repair')) return true;

      // Amenity repair stations
      if (tags.amenity && tags.amenity.toLowerCase().includes('repair')) return true;

      // Service tag explicitly indicates repair
      if (tags.service && tags.service.toLowerCase().includes('repair')) return true;

      // If primary tag is one of known repair-capable shops, accept
      const allowedShops = ['mobile_phone', 'computer', 'appliance', 'bicycle', 'bicycle_repair_station', 'watchmaker', 'hardware'];
      if (allowedShops.includes(primary)) return true;

      // If name includes repair-related keywords, accept
      for (const kw of repairKeywords) {
        if (name.includes(kw)) return true;
      }

      // If tag keys or values contain repair keywords, accept
      for (const v of Object.values(tags)) {
        if (typeof v === 'string' && repairKeywords.some((kw) => v.toLowerCase().includes(kw))) return true;
      }

      return false;
    }

    // Filter to repair/service centers only
    const repairFiltered = rawServices.filter(looksLikeRepair) as NearbyService[];

    // If strict filter finds nothing, fall back to all raw services
    const baseList = (repairFiltered.length > 0 ? repairFiltered : rawServices) as NearbyService[];

    // Continue with category and query filtering on the base list
    let filtered = baseList;

    // Apply category filter if provided (map app categories to OSM tag values)
    const categoryMap: Record<string, string[]> = {
      mobile: ['mobile_phone', 'electronics'],
      laptop: ['computer', 'electronics'],
      appliances: ['appliance'],
      electronics: ['electronics'],
      clothing: ['tailor', 'shoemaker'],
      furniture: [],
      bikes: ['bicycle', 'bicycle_repair_station'],
      tools: ['hardware'],
    };

    if (category && category !== 'all') {
      const allowed = categoryMap[category] || [];
      if (allowed.length > 0) {
        filtered = filtered.filter((s) => allowed.includes(s.type));
      } else {
        // If no mapping, attempt to match by name or address
        const catLower = category.toLowerCase();
        filtered = filtered.filter(
          (s) => s.name.toLowerCase().includes(catLower) || s.address.toLowerCase().includes(catLower)
        );
      }
    }

    // Apply free-text query filter if provided
    if (query && query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          s.type.toLowerCase().includes(q)
      );
    }

    const services = filtered
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 20); // Limit to 20 results

    searchCache.set(cacheKey, {
      timestamp: Date.now(),
      data: services,
    });

    return services;
  } catch (error) {
    console.error('Error fetching nearby services:', error);
    return [];
  }
}

export async function geocodeLocation(query: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      {
        headers: {
          'User-Agent': 'RepairFirst/1.0',
        },
      }
    );

    if (!response.ok) throw new Error('Geocoding failed');

    const data = await response.json();
    if (data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}
