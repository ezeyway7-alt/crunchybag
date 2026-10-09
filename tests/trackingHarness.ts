import React from 'react';
import {createRoot} from 'react-dom/client';
import * as tracker from '../src/lib/journeyTracking';
import {useWebsiteTraffic} from '../src/lib/useWebsiteTraffic';
(window as any).tracker=tracker;
function App(){
  useWebsiteTraffic(location.pathname,'1','customer',false);
  return React.createElement('p',null,'Ready');
}
createRoot(document.getElementById('root')!).render(React.createElement(App));
