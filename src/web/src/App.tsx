import { useEffect, useState } from 'react';
import ProjectList from './projects/ProjectList';
import ProjectPage from './projects/ProjectPage';
import './style.css';
import TodayPage from './today/TodayPage';

export default function App() {
  const [route, setRoute] = useState(window.location.hash);
  useEffect(() => {
    const navigate = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  const navigation = (
    <nav aria-label="Main navigation">
      <a href="#/" aria-current={route !== '#/today' ? 'page' : undefined}>
        Projects
      </a>
      <a href="#/today" aria-current={route === '#/today' ? 'page' : undefined}>
        Today
      </a>
    </nav>
  );
  if (route === '#/today')
    return (
      <>
        {navigation}
        <TodayPage />
      </>
    );
  if (route === '' || route === '#' || route === '#/')
    return (
      <>
        {navigation}
        <ProjectList />
      </>
    );
  const match = /^#\/projects\/([1-9]\d*)$/.exec(route);
  return (
    <>
      {navigation}
      {match ? (
        <ProjectPage key={match[1]} projectId={match[1]} />
      ) : (
        <main>
          <a href="#/">Back to projects</a>
          <h1>Page not found</h1>
        </main>
      )}
    </>
  );
}
