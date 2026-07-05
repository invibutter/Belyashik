import { Button } from './components/Button';

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center gap-4 bg-slate-50">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  );
}

export default App;
