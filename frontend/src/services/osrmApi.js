/**
 * Service to interface with the public OSRM routing API.
 * Snaps straight-line route coordinates to actual road geometries.
 */

/**
 * Snaps a list of waypoint coordinates to the road network.
 * @param {Array<[number, number]>} coordinates - Array of [lat, lng] pairs.
 * @returns {Promise<{coordinates: Array<[number, number]>, distance_km: string|null, estimated_time_min: number|null}>}
 */
export async function snapRouteToRoads(coordinates) {
  if (!coordinates || coordinates.length < 2) {
    return {
      coordinates: coordinates || [],
      distance_km: null,
      estimated_time_min: null,
    };
  }

  try {
    // OSRM expects: longitude,latitude separated by semicolons
    const coordString = coordinates
      .map((coord) => `${coord[1]},${coord[0]}`)
      .join(';');

    const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OSRM API responded with status ${response.status}`);
    }

    const data = await response.json();
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error(`OSRM routing failed with code: ${data.code}`);
    }

    const route = data.routes[0];
    // OSRM returns coordinates as [lng, lat], map back to [lat, lng] for Leaflet
    const snappedCoords = route.geometry.coordinates.map((coord) => [
      coord[1],
      coord[0],
    ]);

    return {
      coordinates: snappedCoords,
      distance_km: (route.distance / 1000).toFixed(1),
      estimated_time_min: Math.round(route.duration / 60),
    };
  } catch (error) {
    console.warn('[osrmApi] Failed to snap route, using straight-line fallback:', error.message);
    return {
      coordinates,
      distance_km: null,
      estimated_time_min: null,
    };
  }
}
