import { LayoutDashboard, BookOpen, Languages, Layers, Archive, Settings } from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/chapters', label: 'Chapters', icon: BookOpen },
  { to: '/vocabulary', label: 'All Vocabulary', icon: Languages },
  { to: '/flashcards', label: 'Flashcards', icon: Layers },
  { to: '/backup', label: 'Backup & Restore', icon: Archive },
  { to: '/settings', label: 'Settings', icon: Settings },
]
