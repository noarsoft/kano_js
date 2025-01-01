import './App.css';

import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import ExcelToCSVDownloader from './components/ExcelToCSVDownloader';
import CSVLoader from './components/CSVLoader';
import KAnonymityDescription from './components/KAnonymityDescription';

function App() {
  return (
    <>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<KAnonymityDescription />} />
          <Route path="/ExcelToCSVDownloader" element={<ExcelToCSVDownloader />} />
          <Route path="/CSVLoader" element={<CSVLoader />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
