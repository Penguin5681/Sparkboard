import React from 'react';
import Whiteboard from './components/Whiteboard';

const Home: React.FC = () => {
  return (
    <div className="app">
      <h1>Local Whiteboard</h1>
      <Whiteboard />
    </div>
  );
};

export default Home;