import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Allotment } from 'allotment';
import { usePortfolio } from '../state/PortfolioContext';
import NavigationPanel from '../panels/NavigationPanel';
import MainContentPanel from '../panels/MainContentPanel';
import ProjectionPanel from '../panels/ProjectionPanel';

const STORAGE_KEY_LAYOUT = 'portfolioWorkspaceLayoutSizes';
const STORAGE_KEY_ACTIVE_VIEW = 'portfolioWorkspaceActiveView';
const defaultSizes = [1, 2, 1];

function PortfolioWorkspacePage() {
  const { portfolioId } = useParams();
  const { 
    portfolio: rawPortfolioData, 
    loading: portfolioLoading, 
    // error: portfolioError,  // Commented out as it's unused
    fetchPortfolio, 
    clearPortfolioError, 
  } = usePortfolio();
  const [sizes, setSizes] = useState(defaultSizes);
  const [activeMainView, setActiveMainView] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_VIEW) || 'assets';
  });
  const allotmentRef = useRef(null);

  useEffect(() => {
    const savedSizes = localStorage.getItem(STORAGE_KEY_LAYOUT);
    if (savedSizes) {
      try {
        const parsedSizes = JSON.parse(savedSizes);
        if (
          Array.isArray(parsedSizes) &&
          parsedSizes.length === 3 &&
          parsedSizes.every(n => typeof n === 'number')
        ) {
          setSizes(parsedSizes);
        } else {
          console.warn('Invalid layout sizes found in localStorage, using defaults.');
          localStorage.removeItem(STORAGE_KEY_LAYOUT);
        }
      } catch (e) {
        console.error('Failed to parse saved layout sizes, using defaults.', e);
        localStorage.removeItem(STORAGE_KEY_LAYOUT);
      }
    }
  }, []);

  const handleDragEnd = newSizes => {
    localStorage.setItem(STORAGE_KEY_LAYOUT, JSON.stringify(newSizes));
    setSizes(newSizes);
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ACTIVE_VIEW, activeMainView);
  }, [activeMainView]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const allotmentElement = allotmentRef.current?.parentElement;
      if (!allotmentElement) return;

      const sashes = allotmentElement.querySelectorAll('.allotment-sash');

      const handleDoubleClick = () => {
        allotmentRef.current?.reset();
        setSizes(defaultSizes);
        localStorage.setItem(STORAGE_KEY_LAYOUT, JSON.stringify(defaultSizes));
      };

      sashes.forEach(sash => {
        sash.removeEventListener('dblclick', handleDoubleClick);
        sash.addEventListener('dblclick', handleDoubleClick);
      });

      return () => {
        sashes.forEach(sash => {
          sash.removeEventListener('dblclick', handleDoubleClick);
        });
      };
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!rawPortfolioData && !portfolioLoading) {
    return <div className="p-4 text-center">Portfolio data not available.</div>;
  }

  if (portfolioLoading && !rawPortfolioData) {
    return <div className="p-4 text-center">Loading portfolio data...</div>;
  }

  return (
    <div className="flex flex-col h-screen p-4 bg-gray-100">
      <nav className="mb-4 text-sm text-gray-600 flex-shrink-0" aria-label="Breadcrumb">
        <ol className="list-none p-0 inline-flex">
          <li className="flex items-center">
            <Link to="/dashboard" className="hover:text-blue-700 hover:underline">
              Dashboard
            </Link>
          </li>
          <li className="flex items-center mx-2">
            <span className="text-gray-400">/</span>
          </li>
          <li className="flex items-center">
            <span className="font-medium text-gray-800" aria-current="page">
              {rawPortfolioData?.name || `Portfolio ${portfolioId}`}
            </span>
          </li>
        </ol>
      </nav>

      <div className="flex-grow min-h-0">
        <Allotment ref={allotmentRef} defaultSizes={sizes} onDragEnd={handleDragEnd}>
          <Allotment.Pane minSize={200} maxSize={600}>
            <div className="h-full bg-white rounded shadow p-4 overflow-auto">
              <NavigationPanel portfolio={rawPortfolioData} isLoading={portfolioLoading} />
            </div>
          </Allotment.Pane>
          <Allotment.Pane minSize={300}>
            <div className="h-full bg-white rounded shadow p-4 overflow-auto">
              <MainContentPanel 
                activeView={activeMainView} 
                setActiveView={setActiveMainView} 
                portfolioLoaded={!!rawPortfolioData}
              />
            </div>
          </Allotment.Pane>
          <Allotment.Pane minSize={250} maxSize={800}>
            <div className="h-full bg-white rounded shadow p-4 overflow-auto">
              <ProjectionPanel />
            </div>
          </Allotment.Pane>
        </Allotment>
      </div>
    </div>
  );
}

export default PortfolioWorkspacePage;
