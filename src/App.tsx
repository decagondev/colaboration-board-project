import { AuthProvider, AuthGuard, useAuth } from '@auth/index';
import { PresenceProvider, PresenceListComponent } from '@presence/index';
import './App.css';

/**
 * Main Board Content Component.
 * Displays the authenticated user's board view.
 */
function BoardContent() {
  const { user, signOut } = useAuth();

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>CollabBoard</h1>
          <div className="header-right">
            <PresenceListComponent />
            <div className="header-user">
              <span>{user?.email}</span>
              <button onClick={signOut} className="sign-out-button">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="app-main">
        <p>Welcome to CollabBoard! The canvas will be rendered here.</p>
      </main>
    </div>
  );
}

/**
 * Authenticated content wrapper with presence provider.
 */
function AuthenticatedApp() {
  return (
    <PresenceProvider>
      <BoardContent />
    </PresenceProvider>
  );
}

/**
 * Root application component for CollabBoard.
 * Wraps the app with auth provider and guard.
 */
function App() {
  return (
    <AuthProvider>
      <AuthGuard>
        <AuthenticatedApp />
      </AuthGuard>
    </AuthProvider>
  );
}

export default App;
