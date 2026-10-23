import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  RotateCcw,
  Thermometer,
  ShieldAlert,
  Search,
  X,
  CheckCircle2,
  Clock,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { AdminLocker } from '../../data/mockAdminData';

interface AdminLockersProps {
  lockers: AdminLocker[];
  onToggleUnlock: (lockerId: string) => void;
  onResetLocker: (lockerId: string) => void;
  onSetMaintenance: (lockerId: string) => void;
  onEmergencyUnlockAll: () => void;
  onToast?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const AdminLockers: React.FC<AdminLockersProps> = ({
  lockers,
  onToggleUnlock,
  onResetLocker,
  onSetMaintenance,
  onEmergencyUnlockAll,
  onToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'reserved' | 'occupied' | 'out_of_service'>('all');

  // Counts for the 4 explicit states
  const availableCount = lockers.filter((l) => l.status === 'available').length;
  const reservedCount = lockers.filter((l) => l.status === 'reserved').length;
  const occupiedCount = lockers.filter((l) => l.status === 'occupied').length;
  const outOfServiceCount = lockers.filter((l) => l.status === 'out_of_service').length;

  // Filter lockers
  const filteredLockers = lockers.filter((l) => {
    const matchesFilter = statusFilter === 'all' || l.status === statusFilter;
    const lockerName = l.name || l.number;
    const matchesSearch =
      lockerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.orderNumber && l.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });


  return (
    <div className="space-y-6 select-none">
      {/* Top Header & Emergency Override */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E3E6D3] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#3D4127] tracking-tight">
              Smart Lockers Controller
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#F0F2E5] text-[#636B2F] border border-[#BAC095]/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#636B2F] animate-pulse" />
              12 Online
            </span>
          </div>
          <p className="text-xs text-[#3D4127]/60 font-medium mt-0.5">
            12-compartment solenoid telemetry, pickup validation, and emergency override
          </p>
        </div>

        {/* Top Emergency Override Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onEmergencyUnlockAll();
              if (onToast) onToast('warning', 'Emergency unlock command transmitted to all 12 compartments.');
            }}
            className="px-4 py-2 rounded-xl bg-[#3D4127] hover:bg-[#2A2D19] text-[#D4DE95] border border-[#636B2F] font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Solenoid override for all 12 compartments"
          >
            <ShieldAlert className="w-4 h-4 text-[#D4DE95]" />
            <span>Emergency Unlock All</span>
          </button>
        </div>
      </div>

      {/* 4 Status Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Available */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'available' ? 'all' : 'available')}
          className={`p-4 rounded-3xl bg-white border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'available'
              ? 'border-[#636B2F] ring-2 ring-[#636B2F]/20 bg-[#F7F8F0]'
              : 'border-[#E3E6D3] hover:border-[#BAC095]'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#3D4127]/70">
              Available
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#636B2F]" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#636B2F]">{availableCount}</span>
            <span className="text-[10px] font-bold text-[#3D4127]/60">Ready to assign</span>
          </div>
        </div>

        {/* Reserved */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'reserved' ? 'all' : 'reserved')}
          className={`p-4 rounded-3xl bg-white border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'reserved'
              ? 'border-[#BAC095] ring-2 ring-[#BAC095]/40 bg-[#FAFBF5]'
              : 'border-[#E3E6D3] hover:border-[#BAC095]'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#3D4127]/70">
              Reserved
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-700">{reservedCount}</span>
            <span className="text-[10px] font-bold text-[#3D4127]/60">120s Hold</span>
          </div>
        </div>

        {/* Occupied */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'occupied' ? 'all' : 'occupied')}
          className={`p-4 rounded-3xl bg-white border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'occupied'
              ? 'border-[#C87A28] ring-2 ring-[#C87A28]/20 bg-amber-50/20'
              : 'border-[#E3E6D3] hover:border-[#BAC095]'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#3D4127]/70">
              Occupied
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#C87A28]" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#C87A28]">{occupiedCount}</span>
            <span className="text-[10px] font-bold text-[#3D4127]/60">Awaiting Pickup</span>
          </div>
        </div>

        {/* Out of Service */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'out_of_service' ? 'all' : 'out_of_service')}
          className={`p-4 rounded-3xl bg-white border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'out_of_service'
              ? 'border-stone-400 ring-2 ring-stone-300 bg-stone-50'
              : 'border-[#E3E6D3] hover:border-[#BAC095]'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#3D4127]/70">
              Out of Service
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-stone-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-stone-500">{outOfServiceCount}</span>
            <span className="text-[10px] font-bold text-[#3D4127]/60">Maintenance</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-3xl border border-[#E3E6D3] p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#3D4127]/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search compartment (e.g. L-01, ORD1234)..."
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-white border border-[#BAC095]/60 text-xs sm:text-sm text-[#3D4127] placeholder:text-[#3D4127]/40 focus:outline-none focus:ring-2 focus:ring-[#636B2F]/30 focus:border-[#636B2F]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-stone-200/50 text-[#3D4127]/50"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#3D4127]/70 hidden sm:inline">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-white border border-[#BAC095]/60 text-xs font-bold text-[#3D4127] focus:outline-none focus:ring-2 focus:ring-[#636B2F]/30 cursor-pointer shadow-xs"
          >
            <option value="all">All 12 Lockers</option>
            <option value="available">Available ({availableCount})</option>
            <option value="reserved">Reserved ({reservedCount})</option>
            <option value="occupied">Occupied ({occupiedCount})</option>
            <option value="out_of_service">Out of Service ({outOfServiceCount})</option>
          </select>
        </div>
      </div>

      {/* 12 Smart Locker Grid */}
      {filteredLockers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#E3E6D3] shadow-xs space-y-2">
          <p className="text-sm font-black text-[#3D4127]">No lockers found</p>
          <p className="text-xs text-[#3D4127]/60">No compartments match the chosen filter or search query.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="px-3 py-1.5 rounded-xl bg-[#F0F2E5] text-[#636B2F] text-xs font-bold border border-[#BAC095] hover:bg-[#E3E6D3]"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredLockers.map((locker) => {
            const visualState = locker.status;
            const isUnlocked = locker.doorState === 'unlocked' || locker.doorState === 'open';

            // Distinct styling per state
            let cardBg = 'bg-white';
            let borderColor = 'border-[#E3E6D3] hover:border-[#636B2F]';
            let badgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
            let stateLabel = 'Available';

            if (visualState === 'reserved') {
              cardBg = 'bg-[#FCFDF9]';
              borderColor = 'border-amber-300/80 shadow-xs';
              badgeBg = 'bg-amber-100 text-amber-900 border-amber-300';
              stateLabel = 'Reserved';
            } else if (visualState === 'occupied') {
              cardBg = 'bg-white';
              borderColor = 'border-[#C87A28]/50 shadow-xs ring-1 ring-[#C87A28]/20';
              badgeBg = 'bg-[#C87A28] text-white border-transparent';
              stateLabel = 'Occupied';
            } else if (visualState === 'out_of_service') {
              cardBg = 'bg-stone-50/70 text-stone-400';
              borderColor = 'border-stone-200';
              badgeBg = 'bg-stone-200 text-stone-600 border-stone-300';
              stateLabel = 'Out of Service';
            }

            return (
              <div
                key={locker.id}
                className={`rounded-3xl p-5 border transition-all duration-200 flex flex-col justify-between group ${cardBg} ${borderColor}`}
              >
                <div>
                  {/* Top Header: Locker Name, State Badge, Temp */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#E3E6D3]/70">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-[#F0F2E5] border border-[#BAC095]/40 flex items-center justify-center font-black text-xs text-[#3D4127] shadow-xs">
                        {locker.name || locker.number}
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${badgeBg}`}>
                        {stateLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#3D4127]/60">
                      <Thermometer className="w-3.5 h-3.5 text-[#636B2F]" />
                      <span>{locker.temperatureC || 21}°C</span>
                    </div>
                  </div>

                  {/* Body Content based on state */}
                  <div className="py-4 space-y-2">
                    {visualState === 'available' && (
                      <div>
                        <p className="text-xs font-bold text-[#3D4127]">Ready for Next Order</p>
                        <p className="text-[11px] text-[#3D4127]/60 mt-0.5">
                          Solenoid armed. Compartment cleaned and stocked.
                        </p>
                        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Dispenser Ready</span>
                        </div>
                      </div>
                    )}

                    {visualState === 'reserved' && (
                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-700 block">
                          Stock Reserved (120s Hold)
                        </span>
                        <div className="text-base font-black text-[#3D4127] mt-0.5">
                          {locker.orderNumber || 'ORD1233'}
                        </div>
                        <p className="text-[11px] text-[#3D4127]/60">
                          Awaiting webhook checkout confirmation.
                        </p>
                        <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-amber-800">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>Expires in ~45s</span>
                        </div>
                      </div>
                    )}

                    {visualState === 'occupied' && (
                      <div>
                        <span className="text-[10px] font-black uppercase text-[#C87A28] block">
                          Assigned Order
                        </span>
                        <div className="text-base font-black text-[#3D4127] mt-0.5">
                          {locker.orderNumber || 'ORD1234'}
                        </div>
                        <p className="text-[11px] text-[#3D4127]/60">
                          Assigned at {locker.assignedAt || '11:32 AM'}
                        </p>
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Awaiting Customer PIN
                        </div>
                      </div>
                    )}

                    {visualState === 'out_of_service' && (
                      <div>
                        <span className="text-[10px] font-black uppercase text-stone-500 block">
                          Maintenance Mode
                        </span>
                        <p className="text-xs font-bold text-stone-700 mt-0.5">
                          Compartment Offline
                        </p>
                        <p className="text-[11px] text-stone-500 mt-1">
                          Sensors inactive. Excluded from dispensing pool.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls: Solenoid Unlock & Maintenance Actions */}
                <div className="pt-3 border-t border-[#E3E6D3]/60 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleUnlock(locker.id)}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs ${
                      isUnlocked
                        ? 'bg-amber-100 border-amber-300 text-amber-900 font-black'
                        : 'bg-white hover:bg-[#F8F9F3] border-[#BAC095]/60 text-[#3D4127]'
                    }`}
                  >
                    {isUnlocked ? (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-amber-700" />
                        <span>Solenoid Open</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-[#636B2F]" />
                        <span>Unlock</span>
                      </>
                    )}
                  </button>

                  {visualState !== 'available' && (
                    <button
                      type="button"
                      onClick={() => onResetLocker(locker.id)}
                      className="p-2 rounded-xl border border-[#BAC095]/60 bg-white hover:bg-[#F8F9F3] text-[#3D4127] cursor-pointer shadow-2xs active:scale-95"
                      title="Reset / Release Compartment"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onSetMaintenance(locker.id)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer shadow-2xs active:scale-95 ${
                      visualState === 'out_of_service'
                        ? 'bg-[#636B2F] text-white border-[#636B2F]'
                        : 'border-[#BAC095]/60 bg-white hover:bg-stone-50 text-[#3D4127]'
                    }`}
                    title={
                      visualState === 'out_of_service'
                        ? 'Restore to Service'
                        : 'Mark Out of Service'
                    }
                  >
                    <Wrench className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hardware Disclaimer Note */}
      <div className="p-4 rounded-2xl bg-[#F0F2E5] border border-[#BAC095]/40 text-xs text-[#3D4127] flex items-center gap-2.5">
        <Sparkles className="w-4 h-4 text-[#636B2F] shrink-0" />
        <span className="font-medium">
          <strong>Sample Telemetry UI:</strong> Visual representation of 12 dispenser compartments.
          Hardware MQTT/solenoid webhooks will synchronize automatically once hardware bridge is attached.
        </span>
      </div>
    </div>
  );
};
