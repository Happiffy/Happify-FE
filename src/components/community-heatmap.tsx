import { useEffect, useRef } from 'react';
import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export type HeatmapRegion = {
  regionKey: string;
  count: number;
  moods: Record<string, number>;
};

type ParsedRegion = {
  latitude: number;
  longitude: number;
};

function parseRegionKey(regionKey: string): ParsedRegion | null {
  const match = /^G([NS])(\d+)_([EW])(\d+)$/.exec(regionKey);
  if (!match) return null;
  const latitude = Number(match[2]) / 10 * (match[1] === 'S' ? -1 : 1);
  const longitude = Number(match[4]) / 10 * (match[3] === 'W' ? -1 : 1);
  return { latitude, longitude };
}

function dominantMood(moods: Record<string, number>) {
  return Object.entries(moods).sort(([, left], [, right]) => right - left)[0]?.[0] ?? 'NEUTRAL';
}

function moodColor(mood: string) {
  return {
    HAPPY: '#58CC02',
    CALM: '#1CB0F6',
    NEUTRAL: '#FFC800',
    ANXIOUS: '#FF9600',
    SAD: '#CE82FF',
    DISTRESSED: '#FF4B4B',
  }[mood] ?? '#999999';
}

export function CommunityHeatmap({ items }: { items: HeatmapRegion[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: [118, -2],
      zoom: 3.8,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }));
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const features = items.flatMap((item) => {
      const region = parseRegionKey(item.regionKey);
      if (!region) return [];
      const size = 0.1;
      const mood = dominantMood(item.moods);
      return [{
        type: 'Feature' as const,
        properties: { regionKey: item.regionKey, count: item.count, mood, color: moodColor(mood) },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[
            [region.longitude, region.latitude],
            [region.longitude + size, region.latitude],
            [region.longitude + size, region.latitude + size],
            [region.longitude, region.latitude + size],
            [region.longitude, region.latitude],
          ]],
        },
      }];
    });
    const data = { type: 'FeatureCollection' as const, features };
    const update = () => {
      const source = map.getSource('happify-heatmap') as maplibregl.GeoJSONSource | undefined;
      if (source) {
        source.setData(data);
        return;
      }
      map.addSource('happify-heatmap', { type: 'geojson', data });
      map.addLayer({ id: 'happify-heatmap-fill', type: 'fill', source: 'happify-heatmap', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': ['interpolate', ['linear'], ['get', 'count'], 3, 0.35, 10, 0.8] } });
      map.addLayer({ id: 'happify-heatmap-line', type: 'line', source: 'happify-heatmap', paint: { 'line-color': ['get', 'color'], 'line-width': 2 } });
      map.on('click', 'happify-heatmap-fill', (event) => {
        const feature = event.features?.[0];
        if (!feature?.geometry || feature.geometry.type !== 'Polygon') return;
        const coordinates = feature.geometry.coordinates[0][0] as [number, number];
        new maplibregl.Popup().setLngLat(coordinates).setHTML(`<strong>${String(feature.properties?.regionKey ?? '')}</strong><br>${String(feature.properties?.count ?? 0)} anonymous contributions<br>Mostly ${String(feature.properties?.mood ?? 'neutral').toLowerCase()}`).addTo(map);
      });
      map.on('mouseenter', 'happify-heatmap-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'happify-heatmap-fill', () => { map.getCanvas().style.cursor = ''; });
    };
    if (map.isStyleLoaded()) update(); else map.once('load', update);
  }, [items]);

  return <div ref={containerRef} className="h-80 w-full overflow-hidden rounded-3xl border-2 border-[#E5E5E5]" aria-label="Anonymous community mood heatmap" />;
}
