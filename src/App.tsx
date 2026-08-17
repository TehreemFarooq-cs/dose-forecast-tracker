import { DoseRefillSettingsForm } from './components/DoseRefillSettingsForm';

export default function App() {
  const handleSave = (data: any) => {
    console.log('Saved settings:', data);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <DoseRefillSettingsForm onSave={handleSave} />
    </div>
  );
}