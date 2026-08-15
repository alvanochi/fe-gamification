'use client'

import AdminGate from '@/components/fragments/AdminGate'
import AdminNav from '@/components/fragments/AdminNav'
import { useState } from 'react'
import MonitoringBoard from '@/components/organisms/admin/MonitoringBoard'
import MissionProgressTable from '@/components/organisms/admin/MissionProgressTable'

export default function AdminMonitoringPage() {
  // Dua sudut pandang atas data yang sama: per kelompok, dan per misi.
  const [tab, setTab] = useState<'GROUP' | 'MISSION'>('GROUP')

  return (
    <AdminGate>
      <div className="min-h-[100dvh] bg-paper px-4 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-secondary">
                Panel Panitia
              </p>
              <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Monitoring</h1>
            </div>
            <AdminNav />
          </div>
          <p className="mt-2 text-sm text-ink/60">
            Progres seluruh kelompok, kehadiran anggota, dan riwayat aktivitas selama acara
            berjalan.
          </p>

          <div className="mt-6 flex gap-2">
            {(
              [
                ['GROUP', 'Per Kelompok'],
                ['MISSION', 'Per Misi'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                aria-pressed={tab === value}
                className={`rounded-md border-brut-sm px-4 py-2 font-display text-xs uppercase shadow-brutal-sm brutal-press-sm ${
                  tab === value ? 'bg-primary text-primary-ink' : 'bg-paper-raised text-ink/70'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {tab === 'GROUP' ? <MonitoringBoard /> : <MissionProgressTable />}
          </div>
        </div>
      </div>
    </AdminGate>
  )
}
