import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee, EmployeeShift } from '../../types';
import { Users, Clock, Plus, CheckCircle, Calendar, Phone, Mail, UserCheck } from 'lucide-react';

export const ShiftsScreen: React.FC = () => {
  const { employees, shifts, addShift, updateShiftStatus, addEmployee } = useApp();

  const [activeTab, setActiveTab] = useState<'SHIFTS' | 'TEAM'>('SHIFTS');
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  // New shift form
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');
  const [notes, setNotes] = useState('');

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;

    addShift({
      employeeId,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      date,
      startTime,
      endTime,
      status: 'PROGRAMADO',
      notes,
    });
    setIsShiftModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="font-serif-display text-xl font-bold text-stone-900">
            Control de Personal & Turnos de Atención
          </h2>
          <p className="text-xs text-stone-500">
            Programación de turnos (Mañana, Tarde, Taller) y roles del equipo
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('SHIFTS')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'SHIFTS' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              Turnos ({shifts.length})
            </button>
            <button
              onClick={() => setActiveTab('TEAM')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'TEAM' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              Equipo ({employees.length})
            </button>
          </div>

          {activeTab === 'SHIFTS' && (
            <button
              onClick={() => setIsShiftModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Asignar Turno</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: SHIFTS */}
      {activeTab === 'SHIFTS' && (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Empleado</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Horario</th>
                  <th className="py-3 px-4">Notas / Tareas</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {shifts.map(shift => (
                  <tr key={shift.id} className="hover:bg-stone-50 transition">
                    <td className="py-3 px-4 font-bold text-stone-900">
                      {shift.employeeName}
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      {shift.date}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-stone-700">
                      {shift.startTime} - {shift.endTime}
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      {shift.notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        shift.status === 'EN_CURSO' ? 'bg-emerald-100 text-emerald-800' :
                        shift.status === 'COMPLETADO' ? 'bg-stone-200 text-stone-700' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {shift.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {shift.status === 'PROGRAMADO' ? (
                        <button
                          onClick={() => updateShiftStatus(shift.id, 'EN_CURSO')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold"
                        >
                          Iniciar Turno
                        </button>
                      ) : shift.status === 'EN_CURSO' ? (
                        <button
                          onClick={() => updateShiftStatus(shift.id, 'COMPLETADO')}
                          className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-semibold"
                        >
                          Finalizar
                        </button>
                      ) : (
                        <span className="text-stone-400 text-[11px]">Cerrado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: EMPLOYEES */}
      {activeTab === 'TEAM' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map(emp => (
            <div key={emp.id} className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 font-bold border border-amber-500/20">
                  {emp.role}
                </span>
                <span className="text-[10px] text-stone-400 font-mono">DNI: {emp.documentNumber}</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-stone-900">{emp.firstName} {emp.lastName}</h3>
                <p className="text-xs text-stone-500">{emp.position}</p>
              </div>
              <div className="pt-2 border-t border-stone-100 text-xs text-stone-600 space-y-1">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  <span>{emp.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-stone-400" />
                  <span>{emp.email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ASSIGN SHIFT MODAL */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-stone-200">
            <div className="bg-stone-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm text-amber-100">Asignar Turno de Atención</h3>
              <button onClick={() => setIsShiftModalOpen(false)} className="text-stone-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateShift} className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700">Empleado:</label>
                <select
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                  className="w-full mt-1 p-2 bg-stone-50 border border-stone-300 rounded-xl"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.position})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold text-stone-700">Fecha:</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                  className="w-full mt-1 p-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-stone-700">Hora Entrada:</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    required
                    className="w-full mt-1 p-2 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700">Hora Salida:</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    required
                    className="w-full mt-1 p-2 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-stone-700">Tareas / Notas:</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ej: Turno Mañana - Apertura de vitrinas"
                  className="w-full mt-1 p-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsShiftModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  Guardar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
