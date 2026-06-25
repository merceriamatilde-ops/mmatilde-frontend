import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Plus, Trash2 } from 'lucide-react';

export interface Turno {
  apertura: string;
  cierre: string;
}

export interface GrupoHorario {
  dias: string[];
  turnos: Turno[];
}

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export function HorariosEditor({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [grupos, setGrupos] = useState<GrupoHorario[]>([]);

  useEffect(() => {
    try {
      if (value) {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          setGrupos(parsed);
        } else {
          setGrupos([]);
        }
      } else {
        setGrupos([]);
      }
    } catch (e) {
      setGrupos([]);
    }
  }, [value]);

  const updateParent = (newGrupos: GrupoHorario[]) => {
    setGrupos(newGrupos);
    onChange(JSON.stringify(newGrupos));
  };

  const addGrupo = () => {
    updateParent([...grupos, { dias: [], turnos: [{ apertura: '09:00', cierre: '13:00' }] }]);
  };

  const removeGrupo = (index: number) => {
    updateParent(grupos.filter((_, i) => i !== index));
  };

  const toggleDia = (grupoIndex: number, dia: string) => {
    const newGrupos = [...grupos];
    const grupo = newGrupos[grupoIndex];
    if (grupo.dias.includes(dia)) {
      grupo.dias = grupo.dias.filter(d => d !== dia);
    } else {
      grupo.dias.push(dia);
    }
    updateParent(newGrupos);
  };

  const addTurno = (grupoIndex: number) => {
    const newGrupos = [...grupos];
    newGrupos[grupoIndex].turnos.push({ apertura: '16:00', cierre: '20:00' });
    updateParent(newGrupos);
  };

  const removeTurno = (grupoIndex: number, turnoIndex: number) => {
    const newGrupos = [...grupos];
    newGrupos[grupoIndex].turnos = newGrupos[grupoIndex].turnos.filter((_, i) => i !== turnoIndex);
    updateParent(newGrupos);
  };

  const updateTurno = (grupoIndex: number, turnoIndex: number, field: keyof Turno, val: string) => {
    const newGrupos = [...grupos];
    newGrupos[grupoIndex].turnos[turnoIndex][field] = val;
    updateParent(newGrupos);
  };

  return (
    <div className="space-y-4">
      {grupos.map((grupo, gIndex) => (
        <div key={gIndex} className="p-4 border border-stone-200 rounded-lg bg-stone-50 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <label className="text-sm font-medium text-stone-700 block mb-2">Días</label>
              <div className="flex flex-wrap gap-2">
                {DIAS_SEMANA.map(dia => (
                  <label key={dia} className="flex items-center space-x-1 text-sm bg-white border border-stone-200 px-2 py-1 rounded cursor-pointer hover:bg-stone-100">
                    <input 
                      type="checkbox" 
                      checked={grupo.dias.includes(dia)}
                      onChange={() => toggleDia(gIndex, dia)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>{dia}</span>
                  </label>
                ))}
              </div>
            </div>
            <button type="button" onClick={() => removeGrupo(gIndex)} className="text-red-500 hover:text-red-700 p-1">
              <Trash2 size={18} />
            </button>
          </div>

          <div>
            <label className="text-sm font-medium text-stone-700 block mb-2">Turnos</label>
            <div className="space-y-2">
              {grupo.turnos.map((turno, tIndex) => (
                <div key={tIndex} className="flex items-center space-x-2">
                  <input 
                    type="time" 
                    value={turno.apertura} 
                    onChange={e => updateTurno(gIndex, tIndex, 'apertura', e.target.value)}
                    className="flex h-9 rounded-md border border-stone-300 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-950"
                  />
                  <span className="text-stone-500">a</span>
                  <input 
                    type="time" 
                    value={turno.cierre} 
                    onChange={e => updateTurno(gIndex, tIndex, 'cierre', e.target.value)}
                    className="flex h-9 rounded-md border border-stone-300 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-950"
                  />
                  <button type="button" onClick={() => removeTurno(gIndex, tIndex)} className="text-stone-400 hover:text-red-600 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => addTurno(gIndex)} className="mt-3">
              <Plus size={14} className="mr-1" /> Agregar Turno
            </Button>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addGrupo}>
        <Plus size={16} className="mr-2" /> Agregar Grupo de Días
      </Button>
    </div>
  );
}
