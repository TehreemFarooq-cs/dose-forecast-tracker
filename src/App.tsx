import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import { RefillSettingsForm, type RefillSettings } from './components/RefillSettingsForm'
import './App.css'

function App() {
  const [settings, setSettings] = useState<RefillSettings | null>(null)

  const handleSaveSettings = (newSettings: RefillSettings) => {
    console.log('Settings saved:', newSettings)
    setSettings(newSettings)
    alert('Settings saved successfully!')
  }

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>DoseForecast</h1>
          <p>
            Smart inventory tracking for your medications.
          </p>
        </div>
        
        <RefillSettingsForm onSave={handleSaveSettings} />

        {settings && (
          <div style={{ marginTop: '20px', padding: '15px', background: 'var(--accent-bg)', borderRadius: '8px', border: '1px solid var(--accent-border)' }}>
            <h3>Last Saved Stock</h3>
            <p>{settings.currentStock} {settings.unitType} remaining</p>
          </div>
        )}
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>About Refills</h2>
          <p>How the tracker helps you stay on top of your doses.</p>
          <ul style={{ flexDirection: 'column', gap: '12px' }}>
            <li>
              <strong>Stock Monitoring:</strong> Calculates remaining days based on your daily dosage.
            </li>
            <li>
              <strong>Lead Time:</strong> Reminds you to refill early enough to account for pharmacy processing.
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
