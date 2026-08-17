import React, { useState } from 'react';
import './RefillSettingsForm.css';

export interface RefillSettings {
  currentStock: number;
  unitType: string;
  lowStockThreshold: number;
  refillQuantity: number;
  pharmacyName: string;
  pharmacyPhone: string;
  rxNumber: string;
  remindersEnabled: boolean;
  leadTimeDays: number;
}

interface Props {
  initialSettings?: Partial<RefillSettings>;
  onSave: (settings: RefillSettings) => void;
  onCancel?: () => void;
}

const DEFAULT_SETTINGS: RefillSettings = {
  currentStock: 0,
  unitType: 'pills',
  lowStockThreshold: 10,
  refillQuantity: 30,
  pharmacyName: '',
  pharmacyPhone: '',
  rxNumber: '',
  remindersEnabled: true,
  leadTimeDays: 5,
};

export const RefillSettingsForm: React.FC<Props> = ({
  initialSettings,
  onSave,
  onCancel,
}) => {
  const [settings, setSettings] = useState<RefillSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const val =
      type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : type === 'number'
        ? Math.max(0, parseFloat(value) || 0)
        : value;

    setSettings((prev) => ({
      ...prev,
      [name]: val,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(settings);
  };

  return (
    <form className="refill-form" onSubmit={handleSubmit}>
      <header className="form-header">
        <h2>Dose Refill Settings</h2>
        <p>Manage your inventory and refill reminders.</p>
      </header>

      <div className="form-grid">
        {/* Inventory Section */}
        <section className="form-section">
          <h3>Inventory & Units</h3>
          <div className="field-group">
            <div className="field">
              <label htmlFor="currentStock">Current Stock</label>
              <input
                type="number"
                id="currentStock"
                name="currentStock"
                value={settings.currentStock}
                onChange={handleChange}
                min="0"
                step="any"
              />
            </div>
            <div className="field">
              <label htmlFor="unitType">Unit Type</label>
              <select
                id="unitType"
                name="unitType"
                value={settings.unitType}
                onChange={handleChange}
              >
                <option value="pills">Pills</option>
                <option value="ml">ml (Milliliters)</option>
                <option value="mcg">mcg (Micrograms)</option>
                <option value="mg">mg (Milligrams)</option>
                <option value="doses">Doses</option>
                <option value="capsules">Capsules</option>
              </select>
            </div>
          </div>
        </section>

        {/* Refill Triggers Section */}
        <section className="form-section">
          <h3>Refill Triggers</h3>
          <div className="field-group">
            <div className="field">
              <label htmlFor="lowStockThreshold">Low Stock Alert at</label>
              <input
                type="number"
                id="lowStockThreshold"
                name="lowStockThreshold"
                value={settings.lowStockThreshold}
                onChange={handleChange}
                min="0"
              />
              <span className="hint">Units remaining</span>
            </div>
            <div className="field">
              <label htmlFor="refillQuantity">Refill Quantity</label>
              <input
                type="number"
                id="refillQuantity"
                name="refillQuantity"
                value={settings.refillQuantity}
                onChange={handleChange}
                min="0"
              />
              <span className="hint">Units per refill</span>
            </div>
          </div>
        </section>

        {/* Pharmacy Details Section */}
        <section className="form-section full-width">
          <h3>Pharmacy & Prescription</h3>
          <div className="field-group col-3">
            <div className="field">
              <label htmlFor="pharmacyName">Pharmacy Name</label>
              <input
                type="text"
                id="pharmacyName"
                name="pharmacyName"
                value={settings.pharmacyName}
                onChange={handleChange}
                placeholder="e.g. Walgreens, CVS"
              />
            </div>
            <div className="field">
              <label htmlFor="pharmacyPhone">Pharmacy Phone</label>
              <input
                type="tel"
                id="pharmacyPhone"
                name="pharmacyPhone"
                value={settings.pharmacyPhone}
                onChange={handleChange}
                placeholder="(555) 000-0000"
              />
            </div>
            <div className="field">
              <label htmlFor="rxNumber">Rx Number</label>
              <input
                type="text"
                id="rxNumber"
                name="rxNumber"
                value={settings.rxNumber}
                onChange={handleChange}
                placeholder="1234567-890"
              />
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="form-section">
          <h3>Notifications</h3>
          <div className="field-group">
            <div className="field checkbox">
              <label className="switch">
                <input
                  type="checkbox"
                  name="remindersEnabled"
                  checked={settings.remindersEnabled}
                  onChange={handleChange}
                />
                <span className="slider round"></span>
              </label>
              <span className="label-text">Enable Refill Reminders</span>
            </div>
            <div className="field">
              <label htmlFor="leadTimeDays">Reminder Lead Time</label>
              <div className="input-with-addon">
                <input
                  type="number"
                  id="leadTimeDays"
                  name="leadTimeDays"
                  value={settings.leadTimeDays}
                  onChange={handleChange}
                  min="0"
                  disabled={!settings.remindersEnabled}
                />
                <span className="addon">days</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="form-actions">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary">
          Save Settings
        </button>
      </footer>
    </form>
  );
};
