import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { LangProvider, useT } from './lib/i18n'
import { Landing } from './Landing'
import { PlayerApp } from './player/PlayerApp'
import { ConsoleApp } from './console/ConsoleApp'
import { Presenter } from './Presenter'
import { Toasts } from './ui'

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function Shell() {
  const t = useT()
  return (
    <>
      <ScrollTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app/*" element={<PlayerApp />} />
        <Route path="/console/*" element={<ConsoleApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Presenter />
      <Toasts undoLabel={t('Undo', 'Anulează')} />
    </>
  )
}

export default function App() {
  return (
    <LangProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </LangProvider>
  )
}
