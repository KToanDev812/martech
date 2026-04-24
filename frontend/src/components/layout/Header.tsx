import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

export function Header() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div>
          <h1 className="text-xl font-bold">Campaign Manager</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {user?.name || user?.email}
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
