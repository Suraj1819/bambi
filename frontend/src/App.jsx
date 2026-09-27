import { Component } from 'react';
import { Routes, Route } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ToastContainer from './components/common/ToastContainer';
import { RoomProvider } from './context/RoomContext';
import Home from './pages/Home';
import CreateRoomPage from './pages/CreateRoomPage';
import JoinRoomPage from './pages/JoinRoomPage';
import RoomPage from './pages/RoomPage';
import NotFound from './pages/NotFound';
import ErrorPage from './pages/ErrorPage';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled application error:', error, info);
  }

  render() {
    if (this.state.hasError) return <ErrorPage error={this.state.error} />;
    return this.props.children;
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <RoomProvider>
        <ErrorBoundary>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<CreateRoomPage />} />
                <Route path="/join" element={<JoinRoomPage />} />
                <Route path="/room/:roomCode" element={<RoomPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
          <ToastContainer />
        </ErrorBoundary>
      </RoomProvider>
    </BrowserRouter>
  );
}