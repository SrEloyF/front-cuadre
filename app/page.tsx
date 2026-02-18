"use client";

import { useState, useMemo, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ConfirmModal from "./components/ui/ConfirmModal";
import TagsConfigModal from "./components/ui/TagsConfigModal";
import ExternoModal from "./components/ui/ExternoModal";
import CierreModal from "./components/ui/CierreModal";
import {
  faArrowTrendUp, faCashRegister, faCoins, faEyeSlash,
  faFileInvoiceDollar, faFilter, faFloppyDisk, faFolderOpen,
  faGear, faLock, faMagnifyingGlass, faPen, faPercentage, faPlus,
  faRotate, faTrash, faTrashCan, faUserTag, faWallet
} from "@fortawesome/free-solid-svg-icons";
import { apiGet, apiPost, apiPut, apiDelete } from "./utils/api";

type Externo = {
  id: any;
  nombre: string;
  monto: any;
};

type Movimiento = {
  id_movement: number;
  type: 'ENTRY' | 'EXIT';
  description: string;
  responsable: string;
  quantity: any;
  comition: number;
  date?: any;
  movement_datum?: any;
};

// --- CONSTANTES INICIALES ---
const TAGS_INICIALES_ENTRADA = ['VENTA CELULAR', 'VENTA ACCESORIO', 'SERVICIO TÉCNICO'];
const TAGS_INICIALES_SALIDA = ['PAGO LUZ', 'ALMUERZO', 'MOVILIDAD'];
const ARQUEO_DATA_INICIAL = { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, m5: 0, m2: 0, m1: 0, m050: 0, m020: 0, m010: 0 };

// --- COMPONENTE ---
export default function Home() {
  // ---------------------------------------------------------------------------
  // Estados persistentes de datos
  // ---------------------------------------------------------------------------

  const [externos, setExternos] = useState<Externo[]>(() => {
    return [];
  });

  // extras del arqueo (vales / documentos)
  const [arqueoExtras, setArqueoExtras] = useState<any[]>(() => {
    return [];
  });

  // ---------------------------------------------------------------------------
  // Estados del formulario principal
  // ---------------------------------------------------------------------------
  const [idEdicion, setIdEdicion] = useState<string | number | null>(null);
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada');
  const [monto, setMonto] = useState<string>('');
  const [comision, setComision] = useState<number | "">(0);
  const [descripcion, setDescripcion] = useState<string>('');
  const [responsableDia, setResponsableDia] = useState<string>(() => '');

  // ---------------------------------------------------------------------------
  // Estados del formulario de arqueo extra
  // ---------------------------------------------------------------------------
  const [extraDesc, setExtraDesc] = useState<string>('');
  const [extraMonto, setExtraMonto] = useState<string>('');
  const [extraTipo, setExtraTipo] = useState<'salida' | 'entrada'>('entrada'); // 'salida' (vale/gasto) o 'entrada' (documento)

  // ---------------------------------------------------------------------------
  // Estados de UI / modales
  // ---------------------------------------------------------------------------
  const [place, setPlace] = useState(1);
  const [idUser, setIdUser] = useState(1);
  const [mostrarArqueo, setMostrarArqueo] = useState<boolean>(false);
  const [cashboxes, setCashboxes] = useState<any[]>([]);
  const [cashboxHoyId, setCashboxHoyId] = useState(null);
  const [mostrarCierre, setMostrarCierre] = useState<boolean>(false);

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showTagsModal, setShowTagsModal] = useState<boolean>(false);
  const [showExternoModal, setShowExternoModal] = useState<boolean>(false);
  
  const [fechaHora, setFechaHora] = useState(() => {
    const now = new Date();
    // Formato YYYY-MM-DDTHH:mm para datetime-local
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  });


  const [deleteTarget, setDeleteTarget] = useState<string | number | null>(null);

  // edición de externos
  const [editingExterno, setEditingExterno] = useState<Externo | null>(null);

  // ---------------------------------------------------------------------------
  // Estados de filtrado
  // ---------------------------------------------------------------------------
  const [filtroTexto, setFiltroTexto] = useState<string>('');
  const [filtroFecha, setFiltroFecha] = useState<string>('');

  // ---------------------------------------------------------------------------
  // Estados de etiquetas y arqueo físico
  // ---------------------------------------------------------------------------
  const [tagsEntrada, setTagsEntrada] = useState<string[]>(() => TAGS_INICIALES_ENTRADA);
  const [tagsSalida, setTagsSalida] = useState<string[]>(() => TAGS_INICIALES_SALIDA);

  const [arqueoData, setArqueoData] = useState<typeof ARQUEO_DATA_INICIAL>(() => ARQUEO_DATA_INICIAL);

  const etiquetasVisibles = tipo === 'entrada' ? tagsEntrada : tagsSalida;


  const [movimientosFiltrados, setMovimientosFiltrados] = useState<Movimiento[]>([]);

  // ---------------------------------------------------------------------------
  // HELPERS / UTILIDADES
  // ---------------------------------------------------------------------------
  const formatearMoneda = (v: string | number | bigint) => {
    const numero = typeof v === "string" ? parseFloat(v) : Number(v);
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(numero);
  };

  const formatearFecha = (s: string | number | Date) =>
    new Date(s).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });


  const isDisabled =
    responsableDia.trim() === '' ||
    monto === '' ||
    descripcion.trim() === '';

  // ---------------------------------------------------------------------------
  // HANDLERS / ACCIONES
  // ---------------------------------------------------------------------------

  const guardarMovimiento = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!responsableDia) {
      alert("⚠️ Ingresa el Responsable del Día.");
      return;
    }

    if (!monto || !descripcion) return;

    if (!cashboxHoyId) {
      alert("⚠️ No hay caja activa para hoy.");
      return;
    }

    const movimientoAGuardar = {
      id_cashbox: cashboxHoyId,
      type: tipo === 'entrada' ? 'ENTRY' : 'EXIT',
      quantity: parseFloat(monto),
      description: descripcion.toUpperCase(),
      comition: parseFloat(comision.toString()) || 0,
      date: new Date(fechaHora).toISOString(),
      id_user: idUser
    };
    console.log("movimientoAGuardar: ", movimientoAGuardar);

    try {
      let savedMovement;

      if (idEdicion) {
        savedMovement = await apiPut(
          `/movements/edit/${idEdicion}`,
          movimientoAGuardar
        );
      } else {
        savedMovement = await apiPost(
          '/movements/create',
          movimientoAGuardar
        );
      }
      console.log("savedMovement: ", savedMovement);

      const movimientoLocal: Movimiento = {
        ...savedMovement,
        responsable: responsableDia,
        description: savedMovement.description.toUpperCase(),
        quantity: parseFloat(savedMovement.quantity.toString()),
        comition: parseFloat(savedMovement.comition?.toString() || "0"),
        movement_datum: savedMovement.movement_datum || savedMovement.data || {}
      };

      if (idEdicion) {
        setMovimientosFiltrados(prev =>
          prev.map(m =>
            m.id_movement === idEdicion ? movimientoLocal : m
          )
        );
        setIdEdicion(null);
      } else {
        setMovimientosFiltrados(prev => [movimientoLocal, ...prev]);
      }

      setMonto('');
      setComision(0);
      setDescripcion('');

    } catch (error: any) {
      console.error('Error al guardar movimiento:', error);
      alert(error?.message || "Ocurrió un error al guardar el movimiento.");
    }
  };

  const iniciarEdicion = (m: Movimiento) => {
    setIdEdicion(m.id_movement);
    setTipo(m.type === 'ENTRY' ? 'entrada' : 'salida');
    setMonto(String(m.quantity));
    setComision(m.comition);
    setDescripcion(m.description);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicion = () => {
    setIdEdicion(null);
    setMonto('');
    setComision(0);
    setDescripcion('');
    setTipo('entrada');
  };

  const solicitarEliminacion = (id: string | number) => {
    setDeleteTarget(id);
    setShowDeleteModal(true);
  };

  const confirmarEliminacion = async () => {
    if (!deleteTarget) return;

    try {
      await apiDelete(`/movements/delete/${deleteTarget}`);
      setMovimientosFiltrados(
        movimientosFiltrados.filter((m) => m.id_movement !== deleteTarget)
      );
      if (idEdicion === deleteTarget) cancelarEdicion();
    } catch (error) {
      console.error("Error al eliminar el movimiento:", error);
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };


  // Externos (agregar / editar / eliminar)
  const handleSaveExterno = (item: { id: any; }) => {
    if (editingExterno) {
      //setExternos(externos.map((ex) => ex.id === item.id ? item : ex));
    } else {
      // agregar nuevo externo:
      // setExternos([...externos, item]);
    }
    setEditingExterno(null);
  };

  const handleDeleteExterno = (id: any) => {
    if (confirm('¿Eliminar este elemento externo?')) {
      setExternos(externos.filter((ex) => ex.id !== id));
    }
  };

  const openEditExterno = (item: Externo) => {
    setEditingExterno(item);
    setShowExternoModal(true);
  };

  // Arqueo extra (vales / documentos)
  const agregarArqueoExtra = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    if (!extraDesc || !extraMonto) return;
    const nuevoExtra = {
      id: Date.now(),
      descripcion: extraDesc.toUpperCase(),
      monto: parseFloat(extraMonto),
      tipo: extraTipo
    };
    // agregar a arreglo de extras:
    // setArqueoExtras([...arqueoExtras, nuevoExtra]);
    setExtraDesc('');
    setExtraMonto('');
  };

  const eliminarArqueoExtra = (id: any) => {
    setArqueoExtras(arqueoExtras.filter((item) => item.id !== id));
  };

  // ---------------------------------------------------------------------------
  // MEMOIZADOS / CÁLCULOS DERIVADOS
  // ---------------------------------------------------------------------------
  const totales = useMemo(() => {
    let entradas = 0, salidas = 0, comisionesTotal = 0;
    movimientosFiltrados.forEach((m) => {
      if (m.type === 'ENTRY') entradas += Number(m.quantity); else salidas += Number(m.quantity);
      comisionesTotal += Number(m.comition || 0);
    });
    const totalExternos = externos.reduce((acc: number, item) => acc + Number(item.monto || 0), 0);
    const balance = (entradas - salidas) + comisionesTotal + totalExternos;
    return { entradas, salidas, balance, comisionesTotal, totalExternos };
  }, [movimientosFiltrados, externos]);

  const totalArqueoFisico = useMemo(() => {
    const totalBilletes =
      (arqueoData.b200 * 200) + (arqueoData.b100 * 100) + (arqueoData.b50 * 50) +
      (arqueoData.b20 * 20) + (arqueoData.b10 * 10) + (arqueoData.m5 * 5) +
      (arqueoData.m2 * 2) + (arqueoData.m1 * 1) + (arqueoData.m050 * 0.50) +
      (arqueoData.m020 * 0.20) + (arqueoData.m010 * 0.10);

    const totalExtras = arqueoExtras.reduce((acc: number, item) => acc + Number(item.monto || 0), 0);
    return totalBilletes + totalExtras;
  }, [arqueoData, arqueoExtras]);

  const diferencia = totalArqueoFisico - totales.balance;

  // ---------------------------------------------------------------------------
  // Al cargar la página
  // ---------------------------------------------------------------------------

  const fetchCashboxes = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isoDate = today.toISOString();

      const data = await apiGet(`/cashbox/get?place=${place}&date=${isoDate}`);

      let openCashbox: any = null;

      if (Array.isArray(data)) {
        openCashbox = data.find((c: any) => c?.state === "OPEN") || null;
      } else if (data && typeof data === "object") {
        openCashbox = data.state === "OPEN" ? data : null;
      }
      setCashboxes(openCashbox ? [openCashbox] : []);

      setCashboxHoyId(openCashbox ? openCashbox.id_cashbox : null);

    } catch (error) {
      console.error("Error al traer cashboxes:", error);
      setCashboxHoyId(null);
      setCashboxes([]);
    }
  };


  useEffect(() => {
    fetchCashboxes();
  }, [place]);

  const cashboxesAbiertos = cashboxes.some(c => c.state === "OPEN");

  useEffect(() => {
  const obtenerMovimientos = async () => {
    if (!cashboxHoyId) {
      setMovimientosFiltrados([]);
      return;
    }

    try {
      const data = await apiGet(`/movements/list?cashbox=${cashboxHoyId}`);
      console.log("Datos recibidos de movimientos:", data);

      const movimientosArray = Array.isArray(data) ? data : [];
      setMovimientosFiltrados(movimientosArray);

      // Chequeo de nombres
      movimientosArray.forEach((m, i) => {
        if (!m.movement_datum) {
          console.warn(`Movimiento ${i} sin movement_datum`, m);
        } else if (!m.movement_datum.user) {
          console.warn(`Movimiento ${i} sin user`, m);
        } else if (!m.movement_datum.user.name) {
          console.warn(`Movimiento ${i} sin user.name`, m);
        } else {
          console.log(`Movimiento ${i} tiene user.name:`, m.movement_datum.user.name);
        }
      });
    } catch (err) {
      console.error("Error al obtener movimientos:", err);
      setMovimientosFiltrados([]);
    }
  };

  obtenerMovimientos();
}, [cashboxHoyId]);



  // Mis funciones
  const abrirDia = async () => {
    try {
      const body = { id_place: place };
      const data = await apiPost("/cashbox/create", body);
      //console.log("Cashbox creado:", data);

      if (data && data.id_cashbox) {
        setCashboxHoyId(data.id_cashbox);
        await fetchCashboxes();
      }
    } catch (error) {
      console.error("Error al abrir día:", error);
    }
  };

  const denominaciones = [
    { label: 'S/ 200', key: 'b200' },
    { label: 'S/ 100', key: 'b100' },
    { label: 'S/ 50', key: 'b50' },
    { label: 'S/ 20', key: 'b20' },
    { label: 'S/ 10', key: 'b10' },
    { label: 'S/ 5', key: 'm5' },
    { label: 'S/ 2', key: 'm2' },
    { label: 'S/ 1', key: 'm1' },
    { label: '0.50', key: 'm050' },
    { label: '0.20', key: 'm020' },
    { label: '0.10', key: 'm010' },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* MODALES */}
      <CierreModal
        isOpen={mostrarCierre}
        onClose={() => setMostrarCierre(false)}
        totales={totales}
        arqueo={totalArqueoFisico}
        diferencia={diferencia}
        responsable={responsableDia}
        externos={externos}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmarEliminacion}
        message="Esta acción no se puede deshacer."
      />

      <TagsConfigModal
        isOpen={showTagsModal}
        onClose={() => setShowTagsModal(false)}
        tipo={tipo}
        tags={tipo === 'entrada' ? tagsEntrada : tagsSalida}
        onUpdateTags={tipo === 'entrada' ? setTagsEntrada : setTagsSalida}
      />

      <ExternoModal
        isOpen={showExternoModal}
        onClose={() => { setShowExternoModal(false); setEditingExterno(null); }}
        onSave={handleSaveExterno}
        item={editingExterno}
      />

      {/* SIDEBAR */}
      <aside className="w-full md:w-72 bg-brand-blue text-white flex flex-col shadow-2xl z-20 overflow-hidden">
        <div className="p-6 text-center border-b border-blue-800 relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-orange" />
          <FontAwesomeIcon icon={faCashRegister} className="text-4xl text-brand-orange mb-3 animate-pulse" />
          <h1 className="text-2xl font-bold tracking-tight">Caja Tienda</h1>
          <p className="text-blue-300 text-xs mt-1">Gestión de Efectivo</p>
        </div>

        <div className="bg-blue-900/50 p-4 border-b border-blue-800 flex-shrink-0">
          <label className="text-xs text-brand-orange font-bold uppercase block mb-1">
            <FontAwesomeIcon icon={faUserTag} className="mr-1" />
            Responsable del Día
          </label>
          <input
            type="text"
            className="w-full bg-blue-800 text-white border border-blue-600 rounded px-3 py-2 focus:outline-none focus:border-brand-orange font-bold text-center"
            value={responsableDia ?? 'admin'}
            onChange={(e) => setResponsableDia(e.target.value)}
            placeholder="INGRESA TU NOMBRE"
          />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 flex flex-col space-y-4">
            <div className="bg-white/10 p-5 rounded-xl border border-white/10 shadow-inner">
              <p className="text-xs text-blue-200 uppercase tracking-wider mb-1">Saldo Actual</p>
              <p className={`text-3xl font-bold ${totales.balance < 0 ? 'text-red-300' : 'text-white'}`}>
                {formatearMoneda(totales.balance)}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center bg-green-900/30 p-2 rounded px-3 border-l-4 border-green-500">
                <span className="text-sm text-green-200">Entradas</span>
                <span className="font-bold">{formatearMoneda(totales.entradas)}</span>
              </div>

              <div className="flex justify-between items-center bg-red-900/30 p-2 rounded px-3 border-l-4 border-red-500">
                <span className="text-sm text-red-200">Salidas</span>
                <span className="font-bold">{formatearMoneda(totales.salidas)}</span>
              </div>

              <div className="flex justify-between items-center bg-orange-900/30 p-2 rounded px-3 border-l-4 border-brand-orange mt-4">
                <span className="text-sm text-orange-200">Comisiones</span>
                <span className="font-bold">{formatearMoneda(totales.comisionesTotal)}</span>
              </div>

              <div className="flex justify-between items-center bg-blue-800/50 p-2 rounded px-3 border-l-4 border-blue-400 mt-1">
                <span className="text-sm text-blue-200">Externos</span>
                <span className="font-bold">{formatearMoneda(totales.totalExternos)}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-blue-800">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-blue-300 uppercase flex items-center gap-2">
                  <FontAwesomeIcon icon={faWallet} />
                  Elementos Externos
                </h3>
                <button
                  onClick={() => setShowExternoModal(true)}
                  className="text-xs border border-blue-400 rounded px-2 py-1 hover:bg-blue-800 transition"
                >
                  <FontAwesomeIcon icon={faPlus} /> Nuevo
                </button>
              </div>

              <div className="space-y-2">
                {externos.length === 0 ? (
                  <p className="text-center text-xs text-blue-500 italic py-2">Sin registros externos.</p>
                ) : (
                  externos.map((ex: any) => (
                    <div key={ex.id} className="bg-blue-900/40 p-2 rounded border border-blue-800/50 flex flex-col group relative">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-200">{ex.nombre}</span>
                        <span className="text-sm font-bold text-brand-orange">{formatearMoneda(ex.monto)}</span>
                      </div>

                      <div className="absolute right-0 top-0 bottom-0 bg-blue-900/90 px-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-r">
                        <button onClick={() => openEditExterno(ex)} className="text-blue-300 hover:text-white">
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        <button onClick={() => handleDeleteExterno(ex.id)} className="text-red-400 hover:text-red-300">
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 flex-shrink-0 bg-brand-blue border-t border-blue-800 z-10">
          <button
            onClick={() => {
              if (cashboxesAbiertos) {
                setMostrarCierre(true);
              } else {
                abrirDia();
              }
            }}
            className={`w-full font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2
              ${cashboxesAbiertos
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
              }`}
          >
            <FontAwesomeIcon icon={faLock} /> {cashboxesAbiertos ? "Cerrar día" : "Abrir día"}
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-gray-800 border-l-4 border-brand-blue pl-3">Operaciones</h2>

          <button
            onClick={() => setMostrarArqueo(!mostrarArqueo)}
            className={`px-5 py-2 rounded-lg shadow-md flex items-center gap-2 font-bold transition-all ${mostrarArqueo ? 'bg-gray-700 text-white' : 'btn-accent'}`}
          >
            <FontAwesomeIcon icon={mostrarArqueo ? faEyeSlash : faCoins} />
            {mostrarArqueo ? 'Ocultar Arqueo' : 'Contar Dinero (Arqueo)'}
          </button>
        </div>

        {/* ARQUEO */}
        {mostrarArqueo && (
          <section className="bg-white rounded-xl shadow-lg border-t-4 border-brand-orange p-6 mb-8 animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
              {denominaciones.map((d) => (
                <div key={d.key} className="bg-gray-50 p-2 rounded border border-gray-200">
                  <label className="block text-xs font-bold text-gray-500 mb-1">{d.label}</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full border rounded px-2 py-2 text-right font-bold text-lg text-brand-blue"
                    value={
                      (arqueoData as any)[d.key] === 0
                        ? ''
                        : (arqueoData as any)[d.key] ?? ''
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      setArqueoData({
                        ...arqueoData,
                        [d.key]: value === '' ? '' : Number(value)
                      });
                    }}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>

            {/* DOCUMENTOS Y VALES */}
            <div className="border-t border-gray-200 pt-4 mb-4">
              <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faFileInvoiceDollar} className="text-brand-orange" />
                Documentos y Vales en Caja
              </h4>

              <div className="flex flex-col md:flex-row gap-2 mb-3">
                <input
                  type="text"
                  className="flex-1 border rounded px-3 py-2 uppercase text-sm"
                  placeholder="Descripción (ej: Voucher Visa, Recibo Luz)"
                  value={extraDesc}
                  onChange={(e) => setExtraDesc(e.target.value.toUpperCase())}
                />

                <div className="relative w-full md:w-32">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">S/</span>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded pl-6 pr-2 py-2 text-sm font-bold"
                    placeholder="0.00"
                    value={extraMonto}
                    onChange={(e) => setExtraMonto(e.target.value)}
                  />
                </div>

                <select
                  className="border rounded px-2 py-2 text-sm bg-white"
                  value={extraTipo}
                  onChange={(e) => setExtraTipo(e.target.value as 'salida' | 'entrada')}
                >
                  <option value="entrada">Entrada (Ingreso)</option>
                  <option value="salida">Salida (Gasto)</option>
                </select>

                <button onClick={agregarArqueoExtra} className="bg-brand-blue text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-800 transition">
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>

              {arqueoExtras.length > 0 && (
                <div className="space-y-1 bg-gray-50 p-2 rounded border border-gray-100 mb-4">
                  {arqueoExtras.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center text-sm border-b border-gray-200 last:border-0 pb-1 last:pb-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${item.tipo === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {item.tipo}
                        </span>
                        <span className="text-gray-700">{item.descripcion}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-800">{formatearMoneda(item.monto)}</span>
                        <button onClick={() => eliminarArqueoExtra(item.id)} className="text-red-400 hover:text-red-600">
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <div className={`text-right px-6 py-3 rounded-lg ${diferencia === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <p className="text-xs font-bold uppercase">Diferencia Final</p>
                <p className="text-2xl font-bold">{diferencia > 0 ? '+' : ''}{formatearMoneda(diferencia)}</p>
              </div>
            </div>
          </section>
        )}

        {/* GRID: FORM + LISTADO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* FORMULARIO PRINCIPAL */}
          <section className={`lg:col-span-5 bg-white rounded-xl shadow-md p-6 border-t-4 h-fit transition-all ${idEdicion ? 'border-brand-orange ring-4 ring-orange-100' : 'border-brand-blue'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-700">{idEdicion ? 'Editando Movimiento' : 'Registrar Movimiento'}</h3>
              <div className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">
                Resp: <span className="font-bold text-brand-blue">{responsableDia || '?'}</span>
              </div>
            </div>
            <form onSubmit={guardarMovimiento} className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTipo('entrada')}
                  className={`py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 border-2 transition-all ${tipo === 'entrada' ? 'bg-green-50 text-green-700 border-green-500 shadow-sm' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}
                >
                  <FontAwesomeIcon icon={faArrowTrendUp} /> Entrada
                </button>

                <button
                  type="button"
                  onClick={() => setTipo('salida')}
                  className={`py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 border-2 transition-all ${tipo === 'salida' ? 'bg-red-50 text-red-700 border-red-500 shadow-sm' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}
                >
                  <FontAwesomeIcon icon={faArrowTrendUp} /> Salida
                </button>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">MONTO TOTAL</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-2xl z-10">S/</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="input-zoom w-full bg-gray-50 border-2 border-gray-300 rounded-xl py-3 pl-12 pr-4 focus:border-brand-blue focus:outline-none text-3xl font-bold text-gray-800"
                    value={monto}
                    onChange={(e) => { setMonto(e.target.value); }}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-bold text-gray-600">DESCRIPCIÓN</label>
                  <button type="button" onClick={() => setShowTagsModal(true)} className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-gray-600 font-bold transition">
                    <FontAwesomeIcon icon={faGear} className="mr-1" /> Configurar Etiquetas
                  </button>
                </div>

                <input
                  type="text"
                  required
                  className="input-zoom w-full bg-gray-50 border-2 border-gray-300 rounded-xl py-3 px-4 focus:border-brand-blue focus:outline-none text-xl font-medium text-gray-800 uppercase"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value.toUpperCase())}
                  placeholder={tipo === 'entrada' ? "¿QUÉ VENDISTE?" : "¿QUÉ GASTASTE?"}
                />

                <div className="flex flex-wrap gap-2 mt-2 animate-fade-in">
                  {etiquetasVisibles.map((tag: string, index: number) => (
                    <button
                      key={`${tag}-${index}`}
                      type="button"
                      onClick={() => setDescripcion(tag)}
                      className={`px-2 py-1 text-xs font-bold rounded border transition ${tipo === 'entrada' ? 'bg-blue-50 text-brand-blue border-blue-100 hover:bg-blue-100' : 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100'}`}
                    >
                      {tag}
                    </button>
                  ))}

                  {etiquetasVisibles.length === 0 && <span className="text-xs text-gray-400 italic">Sin etiquetas. ¡Añade algunas!</span>}
                </div>
              </div>

              <div className="bg-orange-50 p-3 rounded-xl border border-orange-200">
                <label className="block text-xs font-bold text-brand-orange uppercase flex justify-between mb-1">
                  <span>Comisión (Obligatorio)</span>
                  <FontAwesomeIcon icon={faPercentage} />
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400 font-bold z-10">S/</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="input-zoom w-full bg-white border border-orange-300 rounded-lg py-2 pl-8 pr-3 focus:ring-2 focus:ring-orange-500 focus:outline-none text-xl font-bold text-gray-700"
                    value={comision}
                    onFocus={(e) => (e.target as HTMLInputElement).select()}
                    onChange={(e) => { const value = e.target.value; setComision(value === "" ? "" : Number.parseFloat(value)); }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">FECHA Y HORA</label>
                  <input
                    type="datetime-local"
                    className="input-zoom w-full bg-gray-50 border-2 border-gray-300 rounded-xl py-3 px-4 focus:border-brand-blue focus:outline-none text-lg text-gray-800"
                    value={fechaHora}
                    onChange={(e) => setFechaHora(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {idEdicion && (
                  <button type="button" onClick={cancelarEdicion} className="flex-1 bg-gray-500 text-white font-bold py-4 rounded-xl shadow hover:bg-gray-600 transition">
                    CANCELAR
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isDisabled}
                  className={`flex-1 py-4 rounded-xl font-bold text-lg shadow-xl flex justify-center items-center gap-2 transition-all ${isDisabled
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : idEdicion
                      ? 'bg-brand-orange text-white hover:bg-orange-600'
                      : 'btn-primary'
                    }`}
                >
                  <FontAwesomeIcon icon={idEdicion ? faRotate : faFloppyDisk} />
                  {idEdicion ? 'ACTUALIZAR' : 'GUARDAR'}
                </button>
              </div>
            </form>
          </section>

          {/* LISTADO DE MOVIMIENTOS */}
          <section className="lg:col-span-7 bg-white rounded-xl shadow-md flex flex-col h-[600px] lg:h-auto border border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faFilter} className="text-brand-blue" /> Filtros Inteligentes
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Busca por: Qué vendiste, Quién o Cuánto..."
                    className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:border-brand-blue text-sm uppercase"
                    value={filtroTexto}
                    onChange={(e) => setFiltroTexto(e.target.value)}
                  />
                </div>

                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-brand-blue text-sm text-gray-600"
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-auto flex-1 p-0 custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100 text-gray-500 text-xs uppercase sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-3">Detalle</th>
                    <th className="p-3 text-right">Monto</th>
                    <th className="p-3 text-center hidden sm:table-cell">Comisión</th>
                    <th className="p-3 text-center w-24">Acciones</th>
                  </tr>
                </thead>

                <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                  {movimientosFiltrados.length === 0 ? (
                    <tr key="sin-movimientos">
                      <td colSpan={4} className="p-10 text-center text-gray-400">
                        <FontAwesomeIcon icon={faFolderOpen} className="text-4xl mb-2 opacity-30" />
                        <p>Sin movimientos</p>
                      </td>
                    </tr>
                  ) : (
                    movimientosFiltrados.map((m: Movimiento) => (
                      
                      <tr key={m.id_movement} className={`hover:bg-blue-50/50 transition duration-150 ${idEdicion === m.id_movement ? 'bg-orange-50' : ''}`}>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${m.type === 'ENTRY' ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="font-bold text-gray-800 text-base">{m.description}</span>
                          </div>

                          <div className="text-xs text-gray-500 ml-4 flex gap-2 mt-1">
                            <span>{formatearFecha(m.date)}</span>
                            <span className="text-gray-300">|</span>
                            <span className="text-blue-600 font-medium">{m.movement_datum?.user?.name ?? 'Sin usuario'}</span>
                          </div>
                        </td>

                        <td className={`p-3 text-right font-bold text-lg ${m.type === 'ENTRY' ? 'text-green-700' : 'text-red-700'}`}>
                          {m.type === 'EXIT' ? '-' : '+'}{formatearMoneda(m.quantity)}
                        </td>

                        <td className="p-3 text-center hidden sm:table-cell">
                          {m.comition > 0 && <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-bold">{formatearMoneda(m.comition)}</span>}
                        </td>

                        <td className="p-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => iniciarEdicion(m)} className="text-blue-500 hover:text-blue-700 p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition" title="Editar">
                              <FontAwesomeIcon icon={faPen} />
                            </button>

                            <button onClick={() => solicitarEliminacion(m.id_movement)} className="text-red-400 hover:text-red-600 p-2 bg-red-50 hover:bg-red-100 rounded-lg transition" title="Eliminar">
                              <FontAwesomeIcon icon={faTrashCan} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
