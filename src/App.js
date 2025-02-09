import './App.css';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import RoomPage from './pages/Room';
import { SocketProvider } from './provider/Socket';
import { PeerProvider } from './provider/Peers';


function App() {
  return (
    <div className="App">
      <SocketProvider>
        <PeerProvider>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/room/:roomId' element={<RoomPage />} />
          </Routes>
        </PeerProvider>
      </SocketProvider>
    </div>
  );
}

export default App;
