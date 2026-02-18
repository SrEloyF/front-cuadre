"use client";

import { faCheck, faPen, faPlus, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";

interface TagsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: string;
  tags: string[];
  onUpdateTags: (tags: string[]) => void;
}

const TagsConfigModal: React.FC<TagsConfigModalProps> = ({
  isOpen,
  onClose,
  tipo,
  tags,
  onUpdateTags,
}) => {
  const [nuevoTag, setNuevoTag] = useState("");
  const [editandoIndex, setEditandoIndex] = useState<number | null>(null);
  const [textoEditado, setTextoEditado] = useState("");

  if (!isOpen) return null;

  const agregarTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tagLimpio = nuevoTag.trim().toUpperCase();
    if (!tagLimpio) return;

    if (tags.includes(tagLimpio)) {
      alert("¡Esa etiqueta ya existe!");
      setNuevoTag("");
      return;
    }

    onUpdateTags([...tags, tagLimpio]);
    setNuevoTag("");
  };

  const borrarTag = (index: number) => {
    const nuevasTags = tags.filter((_, i) => i !== index);
    onUpdateTags(nuevasTags);
  };

  const empezarEdicion = (index: number, texto: string) => {
    setEditandoIndex(index);
    setTextoEditado(texto);
  };

  const guardarEdicion = (index: number) => {
    const tagEditadoLimpio = textoEditado.trim().toUpperCase();
    if (!tagEditadoLimpio) return;

    if (tags.includes(tagEditadoLimpio) && tags[index] !== tagEditadoLimpio) {
      alert("¡Esa etiqueta ya existe!");
      return;
    }

    const nuevasTags = [...tags];
    nuevasTags[index] = tagEditadoLimpio;
    onUpdateTags(nuevasTags);
    setEditandoIndex(null);
    setTextoEditado("");
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div
          className={`p-4 text-white font-bold flex justify-between items-center ${
            tipo === "entrada" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          <h3>Configurar Etiquetas de {tipo.toUpperCase()}</h3>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-2 rounded-full"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="p-4 bg-gray-50 border-b">
          <form onSubmit={agregarTag} className="flex gap-2">
            <input
              type="text"
              className="flex-1 border rounded px-3 py-2 uppercase focus:outline-none focus:ring-2 ring-blue-500"
              placeholder="Nueva etiqueta..."
              value={nuevoTag}
              onChange={(e) => setNuevoTag(e.target.value.toUpperCase())}
              autoFocus
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </form>
        </div>

        <div className="overflow-y-auto p-4 space-y-2 flex-1">
          {tags.length === 0 ? (
            <p className="text-center text-gray-400 italic">
              No hay etiquetas personalizadas.
            </p>
          ) : (
            tags.map((tag, index) => (
              <div
                key={`${tag}-${index}`}
                className="flex justify-between items-center bg-white border p-3 rounded shadow-sm"
              >
                {editandoIndex === index ? (
                  <div className="flex gap-2 w-full">
                    <input
                      type="text"
                      className="flex-1 border rounded px-2 py-1 uppercase"
                      value={textoEditado}
                      onChange={(e) =>
                        setTextoEditado(e.target.value.toUpperCase())
                      }
                    />
                    <button
                      onClick={() => guardarEdicion(index)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <FontAwesomeIcon icon={faCheck} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="font-bold text-gray-700">{tag}</span>
                    <div className="flex gap-3 text-gray-400">
                      <button
                        onClick={() => empezarEdicion(index, tag)}
                        className="hover:text-blue-500"
                      >
                        <FontAwesomeIcon icon={faPen} />
                      </button>
                      <button
                        onClick={() => borrarTag(index)}
                        className="hover:text-red-500"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 text-right">
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};

export default TagsConfigModal;
