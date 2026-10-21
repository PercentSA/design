"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { FileText, Upload, X } from "lucide-react";
import { cn } from "../lib/cn";
import { useStrings, useText } from "../provider";
import { useFieldControl } from "./field";
import { acceptsFile, formatFileSize } from "../lib/files";

/**
 * Drop zone around a real file input, so the form posts the files (use encType="multipart/form-data").
 * Files that are too large or of the wrong type are refused with a message.
 */
export function FileDrop({
  name,
  accept,
  multiple,
  maxSizeMb = 10,
  onFilesChange,
  className,
  ...props
}: {
  name?: string;
  accept?: string;
  multiple?: boolean;
  maxSizeMb?: number;
  onFilesChange?: (files: File[]) => void;
  className?: string;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}) {
  const s = useStrings();
  const t = useText();
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>();
  const [over, setOver] = useState(false);
  const field = useFieldControl(props);
  const invalid = field["aria-invalid"] || (error ? true : undefined);

  const commit = (next: File[]) => {
    setFiles(next);
    // Keep the input's own file list equal to what the page shows, so the form posts the same files.
    const dt = new DataTransfer();
    next.forEach((f) => dt.items.add(f));
    if (input.current) input.current.files = dt.files;
    onFilesChange?.(next);
  };
  const take = (list: FileList | null) => {
    const picked = [...(list ?? [])];
    const bad = picked.find((f) => !acceptsFile(f, accept) || f.size > maxSizeMb * 1_000_000);
    setError(bad ? (acceptsFile(bad, accept) ? s.errors.fileTooLarge(maxSizeMb) : s.errors.fileType) : undefined);
    const good = picked.filter((f) => acceptsFile(f, accept) && f.size <= maxSizeMb * 1_000_000);
    // One file: a refused file keeps the earlier one (commit also puts it back in the input).
    commit(multiple ? [...files, ...good] : good.length ? good.slice(0, 1) : files);
  };
  // A form reset empties the file input; empty the list with it.
  useEffect(() => {
    const form = input.current?.form;
    const clear = () => {
      setFiles([]);
      setError(undefined);
      onFilesChange?.([]);
    };
    form?.addEventListener("reset", clear);
    return () => form?.removeEventListener("reset", clear);
  }, [onFilesChange]);
  const drop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    take(e.dataTransfer.files);
  };

  return (
    <div className={cn("grid gap-3", className)}>
      <label
        data-over={over || undefined}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={drop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line-strong bg-surface px-6 py-10 text-center transition-colors hover:border-fg-3 data-over:border-fg data-over:bg-surface-2 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-3 has-[input:focus-visible]:outline-fg",
          invalid && "border-danger",
        )}
      >
        <Upload aria-hidden className="size-5 text-fg-2" />
        <span className="text-sm text-fg">{t(s.dropFiles)}</span>
        <span className="text-xs text-fg-3">{t(s.fileLimit(maxSizeMb))}</span>
        <input
          ref={input}
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => take(e.target.files)}
          {...field}
          aria-invalid={invalid}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {files.length > 0 && (
        <ul className="grid gap-2">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-field border border-line bg-surface px-4 py-2.5 text-sm">
              <FileText aria-hidden className="size-4 shrink-0 text-fg-3" />
              <span className="min-w-0 flex-1 truncate text-fg">{f.name}</span>
              <span dir="ltr" className="text-xs text-fg-3 tabular-nums">
                {formatFileSize(f.size)}
              </span>
              <button
                type="button"
                aria-label={s.remove(f.name)}
                onClick={() => {
                  commit(files.filter((_, j) => j !== i));
                  // The button is removed with its row; focus would fall to the page.
                  input.current?.focus();
                }}
                className="grid size-7 place-items-center rounded-pill text-fg-3 hover:bg-surface-2 hover:text-fg"
              >
                <X aria-hidden className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
