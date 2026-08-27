'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="rounded-full border-border/60 bg-background/60 backdrop-blur"
      aria-label="تبديل المظهر"
    >
      {mounted ? (
        theme === 'dark' ? (
          <Sun className="h-[1.1rem] w-[1.1rem] text-amber-400" />
        ) : (
          <Moon className="h-[1.1rem] w-[1.1rem]" />
        )
      ) : (
        <Sun className="h-[1.1rem] w-[1.1rem]" />
      )}
    </Button>
  )
}
