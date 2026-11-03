import { useEffect, useState } from 'react';
import ProjectList from './projects/ProjectList';
import ProjectPage from './projects/ProjectPage';
import './style.css';

export default function App() {
  const [route, setRoute] = useState(window.location.hash);
  useEffect(() => {
    const navigate = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  if (route === '' || route === '#' || route === '#/') return <ProjectList />;
  const match = /^#\/projects\/([1-9]\d*)$/.exec(route);
  return match ? (
    <ProjectPage key={match[1]} projectId={match[1]} />
  ) : (
    <main>
      <a href="#/">Back to projects</a>
      <h1>Page not found</h1>
    </main>
  );
}
