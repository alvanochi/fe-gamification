'use client'

import { useState } from 'react'
import AdminPageShell from '@/components/fragments/AdminPageShell'
import MonitoringBoard from '@/components/organisms/admin/MonitoringBoard'
import MissionProgressTable from '@/components/organisms/admin/MissionProgressTable'

export default function AdminMonitoringPage() {
  // Dua sudut pandang atas data yang sama: per kelompok, dan per misi.
  const [tab, setTab] = useState<'GROUP' | 'MISSION'>('GROUP')

  return (
    <AdminPageShell
      title="Monitoring"
      description="Progres seluruh kelompok, kehadiran anggota, dan riwayat aktivitas selama acara berjalan."
    >
      <div className="flex gap-2">
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

      <div className="mt-6">{tab === 'GROUP' ? <MonitoringBoard /> : <MissionProgressTable />}</div>
    </AdminPageShell>
  )
}
