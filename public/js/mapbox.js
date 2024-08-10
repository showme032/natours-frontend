export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoic2hvd21lMDMyIiwiYSI6ImNseThxZ3YybjBneWcycHF3N2V5Ymh6bjgifQ.r9UF4d7C-N92PAKbLG_Lgw';

  const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/light-v11', // style URL
    scrollZoom: false, // so map doesn't hijack scroll from the webpage
  });

  // CONSTRAIN MAP VIEW TO OUR TOUR AREA
  const bounds = new mapboxgl.LngLatBounds();

  // Create markers for each loc in our location
  locations.forEach(loc => {
    // Create marker html element
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker el to map obj
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom', // bottom of marker is set onto lcoation
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add location popup above the marker, offset so it doesn't cover marker
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include the current location
    bounds.extend(loc.coordinates);
  });

  // Make the map view fit within bounds. fitBounds executes moving/zooming. After load
  map.on('load', () => {
    map.fitBounds(bounds, {
      padding: {
        top: 200,
        bottom: 160,
        left: 180,
        right: 180,
      },
      duration: 0,
    });
  });

};
