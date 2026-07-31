import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

/** Wraps the five tab destinations — pushed full-screen flows (Send, Scan, etc.) render outside this. */
export function AppShell() {
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  )
}
