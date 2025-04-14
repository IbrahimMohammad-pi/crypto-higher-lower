import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import HowToPlay from './pages/HowToPlay';
import { WalletProvider } from './contexts/WalletContext';
import './App.css';

function App() {
  return (
    <WalletProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/game/:gameId" element={<Game />} />
          <Route path="/how-to-play" element={<HowToPlay />} />
        </Routes>
      </Router>
    </WalletProvider>
  );
}

export default App;
