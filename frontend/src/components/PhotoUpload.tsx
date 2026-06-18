"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { validateImage } from "@/lib/attachments";
import { formatBytes } from "@/lib/format";

type Props = {
  label?: string;
  value: File | null;
  onChange: (file: File | null) => void;
  /** Mostra estado de envio em andamento. */
  uploading?: boolean;
  disabled?: boolean;
};

export function PhotoUpload({
  label = "Foto",
  value,
  onChange,
  uploading = false,
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Gera/revoga a URL de preview conforme o arquivo muda.
  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      onChange(null);
      setError(null);
      return;
    }
    const validationError = validateImage(file);
    if (validationError) {
      setError(validationError);
      onChange(null);
      e.target.value = "";
      return;
    }
    setError(null);
    onChange(file);
  };

  const clear = () => {
    onChange(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <span className="block text-sm font-medium text-slate-700">{label}</span>

      {!value && (
        <label
          className={`mt-1 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 hover:border-slate-400 hover:bg-slate-100 ${
            disabled ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <span aria-hidden className="text-xl">
            📷
          </span>
          <span className="font-medium text-slate-600">
            Clique para selecionar uma imagem
          </span>
          <span className="text-xs text-slate-400">JPEG ou PNG, até 5 MB</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="sr-only"
            onChange={handleChange}
            disabled={disabled}
          />
        </label>
      )}

      {value && preview && (
        <div className="mt-1 flex items-center gap-3 rounded-md border border-slate-200 bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Pré-visualização da foto selecionada"
            className="h-16 w-16 rounded object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-700">
              {value.name}
            </p>
            <p className="text-xs text-slate-500">{formatBytes(value.size)}</p>
            {uploading && (
              <p className="mt-1 text-xs text-blue-600">Enviando…</p>
            )}
          </div>
          {!uploading && (
            <button
              type="button"
              onClick={clear}
              className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              Remover
            </button>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
