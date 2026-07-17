import { useEffect, useMemo, useState } from 'react'
import type { FeatureCollection, Polygon } from 'geojson'
import maplibregl from 'maplibre-gl'
import { Map, MapControls, useMap } from '@/components/ui/map'

export type HeatmapRegion = {
  regionKey: string
  count: number
  moods: Record<string, number>
  latitude: number
  longitude: number
  bounds: { south: number, west: number, north: number, east: number }
}

type HeatmapProperties = {
  id: string
  regionKey: string
  count: number
  mood: string
  color: string
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

function HeatmapLayer({ data, onSelect }: { data: FeatureCollection<Polygon, HeatmapProperties>, onSelect: (properties: HeatmapProperties) => void }) {
  const { map, isLoaded } = useMap()

  useEffect(() => {
    if (!map || !isLoaded) return
    const render = () => {
      const source = map.getSource('happify-heatmap') as maplibregl.GeoJSONSource | undefined
      if (source) source.setData(data)
      else {
        map.addSource('happify-heatmap', { type: 'geojson', data })
        map.addLayer({ id: 'happify-heatmap-fill', type: 'fill', source: 'happify-heatmap', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.7 } })
        map.addLayer({ id: 'happify-heatmap-outline', type: 'line', source: 'happify-heatmap', paint: { 'line-color': ['get', 'color'], 'line-width': 2 } })
        map.on('click', 'happify-heatmap-fill', (event) => {
          const feature = event.features?.[0]
          if (feature?.properties) onSelect(feature.properties as unknown as HeatmapProperties)
        })
        map.on('mouseenter', 'happify-heatmap-fill', () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', 'happify-heatmap-fill', () => { map.getCanvas().style.cursor = '' })
      }
      if (data.features.length > 0) {
        const coordinates = data.features.flatMap((feature) => feature.geometry.coordinates[0])
        const bounds = coordinates.reduce((current, coordinate) => current.extend(coordinate as [number, number]), new maplibregl.LngLatBounds(coordinates[0] as [number, number], coordinates[0] as [number, number]))
        map.fitBounds(bounds, { padding: 68, maxZoom: 12, duration: 0 })
      }
    }
    render()
  }, [data, isLoaded, map, onSelect])

  return null
}

export function CommunityHeatmap({ items }: { items: HeatmapRegion[] }) {
  const [selected, setSelected] = useState<HeatmapProperties | null>(null)
  const data = useMemo<FeatureCollection<Polygon, HeatmapProperties>>(() => ({
    type: 'FeatureCollection',
    features: items.flatMap((item) => {
      const mood = dominantMood(item.moods)
      return [{
        type: 'Feature' as const,
        properties: { id: item.regionKey, regionKey: item.regionKey, count: item.count, mood, color: moodColor(mood) },
        geometry: { type: 'Polygon' as const, coordinates: [[
          [item.bounds.west, item.bounds.south], [item.bounds.east, item.bounds.south], [item.bounds.east, item.bounds.north], [item.bounds.west, item.bounds.north], [item.bounds.west, item.bounds.south],
        ]] },
      }]
    }),
  }), [items])

  return <div className="relative h-80 w-full overflow-hidden rounded-3xl border-2 border-[#E5E5E5]" aria-label="Anonymous community mood heatmap">
    <Map center={[106.8, -6.2]} zoom={10} styles={{ light: 'https://tiles.openfreemap.org/styles/bright', dark: 'https://tiles.openfreemap.org/styles/bright' }}>
      <HeatmapLayer data={data} onSelect={setSelected} />
      <MapControls position="top-right" showFullscreen={false} showLocate={false} />
    </Map>
    {selected && <div className="absolute bottom-4 left-4 rounded-2xl bg-white px-4 py-3 font-bold shadow-[0_3px_0_#D9D9D9]">
      <p className="font-black text-[#3C3C3C]">{selected.count} anonymous people</p>
      <p className="text-sm text-[#777]">Mostly {selected.mood.toLowerCase()}</p>
    </div>}
  </div>
}
