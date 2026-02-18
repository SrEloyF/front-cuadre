"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState, useEffect } from "react";

export interface ExternoItem {
  id: number;
  nombre: string;
  monto: number | string;
}

interface ExternoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: ExternoItem) => void;
  item: ExternoItem | null;
}

const ExternoModal: React.FC<ExternoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  item,
}) => {
  const [nombre, setNombre] = useState(item ? item.nombre : "");
  const [monto, setMonto] = useState(item ? item.monto : "");

  useEffect(() => {
    if (item) {
      setNombre(item.nombre);
      setMonto(item.monto);
    } else {
      setNombre("");
      setMonto("");
    }
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !monto) return;

    onSave({
      id: item ? item.id : Date.now(),
      nombre: nombre.toUpperCase(),
      monto: parseFloat(monto as string),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-brand-blue p-4 text-white font-bold flex justify-between items-center">
          <h3>{item ? "Editar Externo" : "Nuevo Elemento Externo"}</h3>
          <button onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Nombre / Concepto
            </label>
            <input
              type="text"
              autoFocus
              className="w-full border rounded px-3 py-2 uppercase font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="EJ: KASNET, DEUDA..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value.toUpperCase())}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Saldo / Monto
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                S/
              </span>
              <input
                type="number"
                step="0.01"
                className="w-full border rounded pl-8 pr-3 py-2 font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0.00"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                required
              />
            </div>
            <p className="text-[10px] text-green-600 mt-1">
              * Este monto se sumará a tu saldo principal.
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-brand-orange text-white font-bold py-2 rounded hover:bg-orange-600 transition"
          >
            Guardar
          </button>
        </form>
      </div>
    </div>
  );
};

export default ExternoModal;
