import './App.css';

/**
 * Root application component for CollabBoard.
 * This component will be wrapped with providers for auth, board state, presence, and AI.
 *
 * @returns The rendered application
 */
function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>CollabBoard</h1>
        <p>Real-Time Collaborative Whiteboard</p>
      </header>
      <main className="app-main">
        <p>Welcome to CollabBoard! The canvas will be rendered here.</p>
      </main>
    </div>
  );
}

export default App;
