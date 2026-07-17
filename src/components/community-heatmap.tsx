import { useMemo, useState } from 'react'
import type { FeatureCollection, Polygon } from 'geojson'
import { Map, MapControls, MapGeoJSON } from '@/components/ui/map'

export type HeatmapRegion = {
  regionKey: string
  count: number
  moods: Record<string, number>
}

type HeatmapProperties = {
  id: string
  regionKey: string
  count: number
  mood: string
  color: string
}

function parseRegionKey(regionKey: string) {
  const match = /^G([NS])(\d+)_([EW])(\d+)$/.exec(regionKey)
  if (!match) return null
  return {
    latitude: Number(match[2]) / 10 * (match[1] === 'S' ? -1 : 1),
    longitude: Number(match[4]) / 10 * (match[3] === 'W' ? -1 : 1),
  }
}

function dominantMood(moods: Record<string, number>) {
  return Object.entries(moods).sort(([, left], [, right]) => right - left)[0]?.[0] ?? 'NEUTRAL'
}

function moodColor(mood: string) {
  return {
    HAPPY: '#58CC02',
    CALM: '#1CB0F6',
    NEUTRAL: '#FFC800',
    ANXIOUS: '#FF9600',
    SAD: '#CE82FF',
    DISTRESSED: '#FF4B4B',
  }[mood] ?? '#999999'
}

export function CommunityHeatmap({ items }: { items: HeatmapRegion[] }) {
  const [selected, setSelected] = useState<HeatmapProperties | null>(null)
  const data = useMemo<FeatureCollection<Polygon, HeatmapProperties>>(() => ({
    type: 'FeatureCollection',
    features: items.flatMap((item) => {
      const region = parseRegionKey(item.regionKey)
      if (!region) return []
      const mood = dominantMood(item.moods)
      const size = 0.1
      return [{
        type: 'Feature' as const,
        properties: { id: item.regionKey, regionKey: item.regionKey, count: item.count, mood, color: moodColor(mood) },
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
      }]
    }),
  }), [items])

  return <div className="relative h-80 w-full overflow-hidden rounded-3xl border-2 border-[#E5E5E5]" aria-label="Anonymous community mood heatmap">
    <Map center={[106.8, -6.2]} zoom={10} styles={{ light: 'https://tiles.openfreemap.org/styles/bright', dark: 'https://tiles.openfreemap.org/styles/bright' }}>
      <MapGeoJSON
        id="happify-heatmap"
        data={data}
        promoteId="id"
        interactive
        fillPaint={{ 'fill-color': ['get', 'color'], 'fill-opacity': 0.65 }}
        linePaint={{ 'line-color': ['get', 'color'], 'line-width': 2 }}
        fillHoverPaint={{ 'fill-opacity': 0.9 }}
        onClick={({ feature }) => setSelected(feature.properties)}
      />
      <MapControls position="top-right" showFullscreen={false} showLocate={false} />
    </Map>
    {selected && <div className="absolute bottom-4 left-4 rounded-2xl bg-white px-4 py-3 font-bold shadow-[0_3px_0_#D9D9D9]">
      <p className="font-black text-[#3C3C3C]">{selected.count} anonymous people</p>
      <p className="text-sm text-[#777]">Mostly {selected.mood.toLowerCase()}</p>
    </div>}
  </div>
}
