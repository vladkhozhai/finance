/**
 * Header Component
 *
 * Main application header with logo and user menu
 * Used in the dashboard layout
 */

export function Header() {
  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="font-semibold text-lg">FinanceFlow</div>
        <div className="ml-auto flex items-center space-x-4">
          {/* User menu will be added here */}
        </div>
      </div>
    </header>
  );
}
