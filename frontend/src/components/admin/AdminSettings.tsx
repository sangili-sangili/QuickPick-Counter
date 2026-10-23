import React, { useState } from 'react';
import { Save, RefreshCw, Zap, Sliders, Server, Check } from 'lucide-react';

interface AdminSettingsProps {
  onTriggerWebhookTest: (orderNumber: string, status: 'captured' | 'failed') => void;
  onResetSeedData: () => void;
  onToast?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  onTriggerWebhookTest,
  onResetSeedData,
  onToast,
}) => {
  const [stationName, setStationName] = useState('QuickPick Counter #01 - Central Campus');
  const [holdDurationSeconds, setHoldDurationSeconds] = useState('120');
  const [upiVpa, setUpiVpa] = useState('quickpick.counter@icici');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [testOrderNumber, setTestOrderNumber] = useState('ORD1234');
  const [savedNotification, setSavedNotification] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotification(true);
    if (onToast) onToast('success', 'Kiosk system settings updated.');
    setTimeout(() => setSavedNotification(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl select-none">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E3E6D3] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#3D4127] tracking-tight">
            Counter System Settings
          </h1>
          <p className="text-xs text-[#3D4127]/60 font-medium mt-0.5">
            Configure stock hold timers, UPI payment endpoints, and hardware diagnostics
          </p>
        </div>

        {savedNotification && (
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            Settings Saved
          </span>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Station Parameters Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E3E6D3] shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E3E6D3]">
            <Sliders className="w-4 h-4 text-[#636B2F]" />
            <h2 className="text-sm font-black text-[#3D4127] tracking-tight">
              Station Parameters
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#3D4127]/80">Kiosk Station Name</label>
              <input
                type="text"
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
                className="w-full bg-white border border-[#BAC095]/60 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#636B2F]/30 focus:border-[#636B2F] text-[#3D4127]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#3D4127]/80">Stock Hold Timeout (Seconds)</label>
              <select
                value={holdDurationSeconds}
                onChange={(e) => setHoldDurationSeconds(e.target.value)}
                className="w-full bg-white border border-[#BAC095]/60 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#636B2F]/30 focus:border-[#636B2F] text-[#3D4127] cursor-pointer"
              >
                <option value="30">30 seconds (Rapid Test)</option>
                <option value="60">60 seconds (Quick Hold)</option>
                <option value="120">120 seconds (Default Specification)</option>
                <option value="300">300 seconds (5 Minutes)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FCFDF9] border border-[#E3E6D3]">
            <div>
              <span className="text-xs font-bold text-[#3D4127] block">Station Maintenance Mode</span>
              <span className="text-[11px] text-[#3D4127]/60 font-medium">
                Temporarily pause new customer orders on the kiosk screen
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                maintenanceMode ? 'bg-[#636B2F]' : 'bg-stone-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* UPI Gateway & Webhook Simulator Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E3E6D3] shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E3E6D3]">
            <Server className="w-4 h-4 text-[#636B2F]" />
            <h2 className="text-sm font-black text-[#3D4127] tracking-tight">
              UPI Gateway & Webhook Dispatcher
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#3D4127]/80">UPI Virtual Payment Address (VPA)</label>
              <input
                type="text"
                value={upiVpa}
                onChange={(e) => setUpiVpa(e.target.value)}
                className="w-full bg-white border border-[#BAC095]/60 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#636B2F]/30 focus:border-[#636B2F] text-[#3D4127]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#3D4127]/80">HMAC-SHA256 Webhook Secret</label>
              <input
                type="password"
                value="whsec_kiosk_live_test_key_9901"
                disabled
                className="w-full bg-[#F8F9F3] border border-[#BAC095]/40 rounded-xl px-3.5 py-2.5 text-xs font-mono text-stone-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Webhook Test Launcher */}
          <div className="p-4 rounded-2xl bg-[#222514] text-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#D4DE95]" />
                <span className="text-xs font-black text-[#D4DE95]">Simulate Signed Webhook Event</span>
              </div>
              <span className="text-[10px] font-bold text-stone-400">POST /payments/webhook</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <input
                type="text"
                value={testOrderNumber}
                onChange={(e) => setTestOrderNumber(e.target.value.toUpperCase())}
                placeholder="ORD1234"
                className="w-full sm:w-44 bg-[#181A0E] border border-[#32361D] rounded-xl px-3 py-2 text-xs font-mono font-bold text-white uppercase placeholder:text-stone-500 focus:outline-none focus:border-[#636B2F]"
              />

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => onTriggerWebhookTest(testOrderNumber, 'captured')}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[#636B2F] hover:bg-[#525926] active:scale-95 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Trigger Paid (Captured)
                </button>
                <button
                  type="button"
                  onClick={() => onTriggerWebhookTest(testOrderNumber, 'failed')}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-amber-600/80 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Flag Discrepancy
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Seed Reset Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E3E6D3] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[#3D4127] block">Reset Inventory & Locker Telemetry</span>
            <span className="text-[11px] text-[#3D4127]/60 font-medium">
              Restores initial mock snacks, categories, orders, and locker compartment states.
            </span>
          </div>

          <button
            type="button"
            onClick={onResetSeedData}
            className="px-4 py-2.5 rounded-xl border border-[#BAC095]/60 hover:bg-[#F8F9F3] text-[#3D4127] active:scale-95 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#636B2F]" />
            <span>Reset Demo Data</span>
          </button>
        </div>

        {/* Save Changes Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-[#636B2F] hover:bg-[#525926] active:scale-95 text-white font-black text-xs shadow-md shadow-[#636B2F]/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4 text-[#D4DE95]" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
