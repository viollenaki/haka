import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import AnalysisPanel from './components/AnalysisPanel';
import RecommendationPanel from './components/RecommendationPanel';
import AboutPage from './pages/AboutPage';

function App() {
  const [selectedFacilityType, setSelectedFacilityType] = useState('school');
  const [mapBounds, setMapBounds] = useState(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const handleFacilityTypeChange = (type) => {
    setSelectedFacilityType(type);
  };

  const handleMapBoundsChange = (bounds) => {
    setMapBounds(bounds);
  };

  const handleRunAnalysis = async () => {
    if (!mapBounds) return;

    setIsAnalysisLoading(true);
    try {
      // Здесь будет вызов API для получения данных
      const response = await fetch(`http://localhost:8001/facilities/${selectedFacilityType}?min_lat=${mapBounds.south}&min_lon=${mapBounds.west}&max_lat=${mapBounds.north}&max_lon=${mapBounds.east}`);
      
      if (!response.ok) throw new Error('Failed to fetch facilities');
      
      const data = await response.json();
      setFacilities(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  const handleGetRecommendations = async () => {
    if (!mapBounds) return;

    try {
      // Здесь будет вызов API для получения рекомендаций
      const response = await fetch('http://localhost:8001/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          facility_type: selectedFacilityType,
          area_bounds: {
            min_lat: mapBounds.south,
            min_lon: mapBounds.west,
            max_lat: mapBounds.north,
            max_lon: mapBounds.east
          }
        }),
      });
      
      if (!response.ok) throw new Error('Failed to get recommendations');
      
      const data = await response.json();
      setRecommendations(data.locations);
    } catch (error) {
      console.error('Error getting recommendations:', error);
    }
  };

  return (
    <Router>
      <div className="App">
        <Header />
        <div className="app-container">
          <Routes>
            <Route path="/" element={
              <>
                <Sidebar 
                  selectedFacilityType={selectedFacilityType}
                  onFacilityTypeChange={handleFacilityTypeChange}
                  onRunAnalysis={handleRunAnalysis}
                  onGetRecommendations={handleGetRecommendations}
                  isLoading={isAnalysisLoading}
                />
                <main className="main-content">
                  <MapView 
                    facilities={facilities}
                    recommendations={recommendations}
                    onBoundsChange={handleMapBoundsChange}
                    facilityType={selectedFacilityType}
                  />
                  <AnalysisPanel 
                    facilities={facilities}
                    facilityType={selectedFacilityType}
                  />
                  <RecommendationPanel 
                    recommendations={recommendations}
                  />
                </main>
              </>
            } />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
