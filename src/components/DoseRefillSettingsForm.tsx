import React, { useState } from 'react';

interface FormData {
  medicationName: string;
  currentInventory: string;
  refillThreshold: string;
  preferredPharmacy: string;
  autoRefillEnabled: boolean;
  deliveryMethod: 'In-Store Pickup' | 'Home Delivery' | 'Express Mail';
}

interface FormErrors {
  [key: string]: string;
}

interface Props {
  onSave: (data: any) => void;
}

export const DoseRefillSettingsForm: React.FC<Props> = ({ onSave }) => {
  const [formData, setFormData] = useState<FormData>({
    medicationName: '',
    currentInventory: '0',
    refillThreshold: '0',
    preferredPharmacy: '',
    autoRefillEnabled: false,
    deliveryMethod: 'In-Store Pickup',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState(false);

  const validate = (): FormErrors => {
    const newErrors: FormErrors = {};
    const inventory = parseInt(formData.currentInventory);
    const threshold = parseInt(formData.refillThreshold);

    if (!formData.medicationName.trim()) newErrors.medicationName = 'Medication Name is required.';
    if (isNaN(inventory) || inventory < 0) newErrors.currentInventory = 'Inventory must be an integer >= 0.';
    if (isNaN(threshold) || threshold <= 0 || threshold >= inventory) 
      newErrors.refillThreshold = 'Threshold must be > 0 and < current inventory.';
    
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
    
    // Clear error for field on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      setSuccess(true);
      onSave(formData);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Refill Settings</h2>
      {success && <div className="bg-green-100 text-green-700 p-2 mb-4 rounded">Settings saved successfully!</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="medicationName" className="block text-sm font-medium">Medication Name *</label>
          <input
            id="medicationName"
            name="medicationName"
            value={formData.medicationName}
            onChange={handleChange}
            className={`w-full border p-2 rounded ${errors.medicationName ? 'border-red-500' : 'border-gray-300'}`}
            aria-invalid={!!errors.medicationName}
            aria-describedby="medicationName-error"
          />
          {errors.medicationName && <span id="medicationName-error" className="text-red-500 text-sm">{errors.medicationName}</span>}
        </div>

        <div>
          <label htmlFor="currentInventory" className="block text-sm font-medium">Current Inventory</label>
          <input
            id="currentInventory"
            type="number"
            name="currentInventory"
            value={formData.currentInventory}
            onChange={handleChange}
            className={`w-full border p-2 rounded ${errors.currentInventory ? 'border-red-500' : 'border-gray-300'}`}
            aria-invalid={!!errors.currentInventory}
            aria-describedby="currentInventory-error"
          />
          {errors.currentInventory && <span id="currentInventory-error" className="text-red-500 text-sm">{errors.currentInventory}</span>}
        </div>

        <div>
          <label htmlFor="refillThreshold" className="block text-sm font-medium">Refill Threshold</label>
          <input
            id="refillThreshold"
            type="number"
            name="refillThreshold"
            value={formData.refillThreshold}
            onChange={handleChange}
            className={`w-full border p-2 rounded ${errors.refillThreshold ? 'border-red-500' : 'border-gray-300'}`}
            aria-invalid={!!errors.refillThreshold}
            aria-describedby="refillThreshold-error"
          />
          {errors.refillThreshold && <span id="refillThreshold-error" className="text-red-500 text-sm">{errors.refillThreshold}</span>}
        </div>

        <div>
          <label htmlFor="deliveryMethod" className="block text-sm font-medium">Delivery Method</label>
          <select
            id="deliveryMethod"
            name="deliveryMethod"
            value={formData.deliveryMethod}
            onChange={handleChange}
            className="w-full border p-2 rounded border-gray-300"
          >
            <option value="In-Store Pickup">In-Store Pickup</option>
            <option value="Home Delivery">Home Delivery</option>
            <option value="Express Mail">Express Mail</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="autoRefillEnabled"
            name="autoRefillEnabled"
            checked={formData.autoRefillEnabled}
            onChange={handleChange}
            className="mr-2"
          />
          <label htmlFor="autoRefillEnabled">Auto-Refill Enabled</label>
        </div>

        <button 
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded disabled:bg-gray-400"
          disabled={hasErrors && Object.values(errors).some(e => e !== '')}
        >
          Save Settings
        </button>
      </form>
    </div>
  );
};
