"use client";

import { faCheck, faPen, faPlus, faThumbtack, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import { apiPost, apiPut, apiDelete } from "@/app/utils/api";

interface Tag {
  id_description: number;
  text: string;
  link: number;
}

interface TagsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  place: number;
  tags: Tag[];
  onRefresh: () => void;
}

const TagsConfigModal: React.FC<TagsConfigModalProps> = ({
  isOpen,
  onClose,
  place,
  tags,
  onRefresh,
}) => {
  const [nuevoTag, setNuevoTag] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [textoEditado, setTextoEditado] = useState("");

  if (!isOpen) return null;

  const agregarTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const limpio = nuevoTag.trim().toUpperCase();
    if (!limpio) return;

    const existe = tags.some(t => t.text === limpio);
    if (existe) {
      alert("La etiqueta ya existe");
      return;
    }

    await apiPost("/descriptions/create", {
      id_place: place,
      text: limpio,
    });

    setNuevoTag("");
    onRefresh();
  };

  const borrarTag = async (id: number) => {
    const tag = tags.find(t => t.id_description === id);
    if (!tag) return;

    if (tag.link > 0) {
      alert("No se puede eliminar. Está siendo usada.");
      return;
    }

    await apiDelete(`/descriptions/delete/${id}`);
    onRefresh();
  };

  const guardarEdicion = async (id: number) => {
    const limpio = textoEditado.trim().toUpperCase();
    if (!limpio) return;

    const existe = tags.some(t => t.text === limpio && t.id_description !== id);
    if (existe) {
      alert("La etiqueta ya existe");
      return;
    }

    await apiPut(`/descriptions/edit/${id}`, {
      text: limpio,
    });

    setEditandoId(null);
    setTextoEditado("");
    onRefresh();
  };

  const toggleLink = async (tag: Tag) => {
    await apiPut(`/descriptions/edit/${tag.id_description}`, {
      text: tag.text,
      link: tag.link === 1 ? 0 : 1,
    });

    onRefresh();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]">

        {/* HEADER */}
        <div className="p-4 bg-blue-600 text-white font-bold flex justify-between">
          <h3>Configurar Etiquetas</h3>
          <button onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* CREAR */}
        <div className="p-4 border-b bg-gray-50">
          <form onSubmit={agregarTag} className="flex gap-2">
            <input
              type="text"
              className="flex-1 border rounded px-3 py-2 uppercase"
              value={nuevoTag}
              onChange={(e) => setNuevoTag(e.target.value.toUpperCase())}
              placeholder="Nueva etiqueta..."
            />
            <button type="submit" className="bg-blue-600 text-white px-4 rounded">
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </form>
        </div>

        {/* LISTA */}
        <div className="overflow-y-auto p-4 space-y-2 flex-1">
          {tags.length === 0 && (
            <p className="text-center text-gray-400 italic">
              No hay etiquetas registradas.
            </p>
          )}

          {tags.map((tag) => (
            <div
              key={tag.id_description}
              className="flex justify-between items-center bg-white border p-3 rounded shadow-sm"
            >
              {editandoId === tag.id_description ? (
                <div className="flex gap-2 w-full">
                  <input
                    className="flex-1 border rounded px-2 py-1 uppercase"
                    value={textoEditado}
                    onChange={(e) =>
                      setTextoEditado(e.target.value.toUpperCase())
                    }
                  />
                  <button
                    onClick={() => guardarEdicion(tag.id_description)}
                    className="text-green-600"
                  >
                    <FontAwesomeIcon icon={faCheck} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="font-bold">{tag.text}</span>

                  <div className="flex gap-4 items-center">
                    <button
                      onClick={() => toggleLink(tag)}
                      className={`transition ${
                        tag.link === 1
                          ? "text-green-600 hover:text-green-800"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                      title={tag.link === 1 ? "Visible en formulario" : "Oculto del formulario"}
                    >
                      <FontAwesomeIcon icon={faThumbtack} />
                    </button>

                    <button
                      onClick={() => {
                        setEditandoId(tag.id_description);
                        setTextoEditado(tag.text);
                      }}
                      className="text-blue-500"
                    >
                      <FontAwesomeIcon icon={faPen} />
                    </button>

                    <button
                      onClick={() => borrarTag(tag.id_description)}
                      className="text-red-500"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t text-right">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-6 py-2 rounded"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};

export default TagsConfigModal;
