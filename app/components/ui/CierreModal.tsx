"use client";

import React from "react";

export interface ExternoItem {
  id: number;
  nombre: string;
  monto: number;
}

interface Totales {
  entradas: number;
  salidas: number;
  balance: number;
  comisionesTotal: number;
}

interface CierreModalProps {
  isOpen: boolean;
  onClose: () => void;
  totales: Totales;
  arqueo: number;
  diferencia: number;
  responsable: string | null;
  externos: ExternoItem[];
}

const CierreModal: React.FC<CierreModalProps> = ({
  isOpen,
  onClose,
  totales,
  arqueo,
  diferencia,
  responsable,
  externos,
}) => {
  if (!isOpen) return null;

  const hoy = new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-brand-blue p-6 text-white text-center">
          <h2 className="text-2xl font-bold uppercase tracking-wider">Cierre de Caja</h2>
          <p className="opacity-80 text-sm mt-1">{hoy}</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Responsable */}
          <div className="text-center mb-4">
            <span className="text-xs text-gray-500 uppercase tracking-widest">Responsable del Día</span>
            <div className="text-xl font-bold text-gray-800">{responsable || "No asignado"}</div>
          </div>

          {/* Totales */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
            <div>
              <p className="text-xs text-gray-500">Total Entradas</p>
              <p className="text-green-600 font-bold">{formatCurrency(totales.entradas)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Salidas</p>
              <p className="text-red-600 font-bold">{formatCurrency(totales.salidas)}</p>
            </div>
            <div className="col-span-2 border-t pt-2 mt-2">
              <p className="text-xs text-gray-500 uppercase">Saldo Sistema</p>
              <p className="text-2xl font-bold text-brand-blue">{formatCurrency(totales.balance)}</p>
              <p className="text-[10px] text-gray-400 text-center mt-1">(Incluye comisiones y externos)</p>
            </div>
          </div>

          {/* Arqueo y diferencia */}
          <div className={`p-4 rounded-xl border-l-4 ${diferencia === 0 ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500"}`}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-bold text-gray-700">Arqueo Físico:</span>
              <span className="font-bold">{formatCurrency(arqueo)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-700">Diferencia:</span>
              <span className={`font-bold text-lg ${diferencia === 0 ? "text-green-600" : "text-red-600"}`}>
                {diferencia > 0 ? "+" : ""}{formatCurrency(diferencia)}
              </span>
            </div>
          </div>

          {/* Externos */}
          {externos.length > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <p className="text-xs font-bold text-brand-blue uppercase mb-2 border-b border-blue-200 pb-1">
                Saldos Externos (Incluidos)
              </p>
              <div className="space-y-1">
                {externos.map(ex => (
                  <div key={ex.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{ex.nombre}</span>
                    <span className="font-bold text-gray-800">{formatCurrency(Number(ex.monto))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comisiones */}
          <div className="text-center">
            <p className="text-xs text-gray-400">Comisiones generadas hoy: {formatCurrency(totales.comisionesTotal)}</p>
          </div>

          {/* Botones */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-xl shadow-md transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CierreModal;
