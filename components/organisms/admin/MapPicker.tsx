'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import Button from '@/components/elements/Button'
import ErrorMessage from '@/components/elements/ErrorMessage'
import { useGeolocation } from '@/hooks/use-geolocation'

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const YOGYAKARTA_CENTER: [number, number] = [-7.797068, 110.370529]
const GEOFENCE_COLOR = '#2e6bff'

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function Recenter({ position }: { position: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(position, Math.max(map.getZoom(), 15))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position[0], position[1]])
  return null
}

interface MapPickerProps {
  lat: string | undefined
  lng: string | undefined
  radiusMeters: number | undefined
  onPick: (lat: string, lng: string) => void
}

export default function MapPicker({ lat, lng, radiusMeters, onPick }: MapPickerProps) {
  const position: [number, number] | null =
    lat && lng && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))
      ? [Number(lat), Number(lng)]
      : null

  const geolocation = useGeolocation()

  useEffect(() => {
    if (geolocation.coords) onPick(geolocation.coords.lat, geolocation.coords.lng)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geolocation.coords])

  const handlePick = (newLat: number, newLng: number) => {
    onPick(newLat.toFixed(6), newLng.toFixed(6))
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs text-ink/60">
          {position
            ? `Lokasi terpilih: ${position[0].toFixed(6)}, ${position[1].toFixed(6)}`
            : 'Ketuk peta untuk memilih titik lokasi target misi.'}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          loading={geolocation.isLocating}
          onClick={geolocation.requestLocation}
        >
          Lokasiku
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border-brut">
        <MapContainer
          center={position ?? YOGYAKARTA_CENTER}
          zoom={position ? 16 : 13}
          style={{ height: 280, width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={handlePick} />
          {position && (
            <>
              <Marker
                position={position}
                draggable
                eventHandlers={{
                  dragend: e => {
                    const { lat: newLat, lng: newLng } = (e.target as L.Marker).getLatLng()
                    handlePick(newLat, newLng)
                  },
                }}
              />
              {!!radiusMeters && (
                <Circle center={position} radius={radiusMeters} pathOptions={{ color: GEOFENCE_COLOR }} />
              )}
              <Recenter position={position} />
            </>
          )}
        </MapContainer>
      </div>
      <ErrorMessage message={geolocation.error ?? undefined} className="mt-2" />
    </div>
  )
}
