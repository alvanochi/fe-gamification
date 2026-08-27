'use client'

import { useState } from 'react'
import AccountsPanel from '@/components/organisms/admin/AccountsPanel'
import GroupsPanel from '@/components/organisms/admin/GroupsPanel'
import { useAdminGroupsQuery } from '@/hooks/use-admin-groups'

/**
 * Master akun & kelompok — dua sudut pandang atas data yang sama, dipisahkan
 * seperti "Per Kelompok / Per Misi" di layar pemantauan.
 *
 * Sebelumnya keduanya bertumpuk di satu daftar: daftar akun dengan tombol
 * kelompok menempel padanya. Pilihan yang sama dipakai untuk dua sasaran yang
 * berbeda (orang, dan kelompok orang itu), dan itu satu-satunya tempat di
 * aplikasi ini di mana mencentang sesuatu bisa mengubah sesuatu yang lain.
 */
export default function AccountManager() {
  const [tab, setTab] = useState<'ACCOUNTS' | 'GROUPS'>('ACCOUNTS')
  const { data: groups } = useAdminGroupsQuery()

  const tabs = [
    ['ACCOUNTS', 'Akun'],
    ['GROUPS', `Kelompok${groups ? ` (${groups.length})` : ''}`],
  ] as const

  return (
    <div>
      <div className="flex gap-2">
        {tabs.map(([value, label]) => (
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

      <div className="mt-6">{tab === 'ACCOUNTS' ? <AccountsPanel /> : <GroupsPanel />}</div>
    </div>
  )
}
