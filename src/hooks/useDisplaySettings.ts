'use client'

import { useState, useEffect, useCallback } from 'react'

export type Theme = 'light' | 'dark' | 'auto'
export type Language = 'en' | 'es' | 'fr' | 'de'
export type ItemsPerPage = 10 | 25 | 50 | 100

export interface DisplaySettings {
  theme: Theme
  language: Language
  itemsPerPage: ItemsPerPage
}

export interface UseDisplaySettingsReturn {
  settings: DisplaySettings
  setTheme: (theme: Theme) => void
  setLanguage: (language: Language) => void
  setItemsPerPage: (itemsPerPage: ItemsPerPage) => void
  resetToDefaults: () => void
  isLoaded: boolean
}

const STORAGE_KEY = 'smile-display-settings'

const defaultSettings: DisplaySettings = {
  theme: 'light',
  language: 'en',
  itemsPerPage: 25,
}

export function useDisplaySettings(): UseDisplaySettingsReturn {
  const [settings, setSettings] = useState<DisplaySettings>(defaultSettings)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<DisplaySettings>
        setSettings({
          theme: parsed.theme ?? defaultSettings.theme,
          language: parsed.language ?? defaultSettings.language,
          itemsPerPage: parsed.itemsPerPage ?? defaultSettings.itemsPerPage,
        })
      }
    } catch (error) {
      console.error('Failed to load display settings:', error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      } catch (error) {
        console.error('Failed to save display settings:', error)
      }
    }
  }, [settings, isLoaded])

  const setTheme = useCallback((theme: Theme) => {
    setSettings((prev) => ({ ...prev, theme }))
  }, [])

  const setLanguage = useCallback((language: Language) => {
    setSettings((prev) => ({ ...prev, language }))
  }, [])

  const setItemsPerPage = useCallback((itemsPerPage: ItemsPerPage) => {
    setSettings((prev) => ({ ...prev, itemsPerPage }))
  }, [])

  const resetToDefaults = useCallback(() => {
    setSettings(defaultSettings)
  }, [])

  return {
    settings,
    setTheme,
    setLanguage,
    setItemsPerPage,
    resetToDefaults,
    isLoaded,
  }
}

export default useDisplaySettings
