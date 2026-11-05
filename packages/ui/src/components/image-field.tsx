"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/cn";
import { useStrings } from "../provider";
import { Button } from "./actions";
import { FileDrop } from "./file-drop";
import { Spinner } from "./spinner";

/**
 * An image upload. FileDrop picks the file, so a wrong type or size is refused before the upload; `upload` sends
 * it and returns its URL. The field shows the preview with Replace and Remove, and `name` posts the URL.
 * A failed upload keeps the old image. An upload that ends after a newer pick or a new `value` is ignored.
 */
export function ImageField({
  value,
  onValueChange,
  upload,
  alt,
  accept = "image/*",
  maxSizeMb = 2,
  aspect,
  name,
  disabled,
  id,
  "aria-describedby": describedBy,
  className,
}: {
  value: string | null;
  onValueChange: (url: string | null) => void;
  upload: (file: File) => Promise<string>;
  alt: string;
  accept?: string;
  maxSizeMb?: number;
  /** CSS aspect ratio of the preview, for example "1 / 1" or "16 / 9". */
  aspect?: string;
  name?: string;
  disabled?: boolean;
  id?: string;
  "aria-describedby"?: string;
  className?: string;
}) {
  const s = useStrings();
  const box = useRef<HTMLDivElement>(null);
  const run = useRef(0);
  const last = useRef<File>(undefined);
  const refocus = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [failed, setFailed] = useState(false);
  const input = () => box.current?.querySelector<HTMLInputElement>('input[type="file"]');

  // A new value (an upload's result, a remove, a form reset) ends any upload still running: its result is ignored.
  useEffect(() => {
    run.current++;
    setUploading(false);
    // After Remove its button is gone: focus goes to the file input, as in FileDrop.
    if (refocus.current) input()?.focus();
    refocus.current = false;
  }, [value]);

  const pick = (files: File[]) => {
    const file = files[0];
    // After a refused pick FileDrop sends the file it kept, which was already taken.
    if (!file || file === last.current) return;
    last.current = file;
    // Empty the input, so the same file can be picked again after a failed upload.
    input()!.value = "";
    const job = ++run.current;
    setFailed(false);
    setUploading(true);
    upload(file).then(
      (url) => {
        if (job !== run.current) return;
        setUploading(false);
        onValueChange(url);
      },
      () => {
        if (job !== run.current) return;
        setUploading(false);
        setFailed(true);
      },
    );
  };
  const remove = () => {
    refocus.current = true;
    setFailed(false);
    onValueChange(null);
  };

  return (
    <div ref={box} aria-busy={uploading || undefined} className={cn("grid gap-3", className)}>
      {value && (
        <div className="flex flex-wrap items-end gap-4">
          <img src={value} alt={alt} style={aspect ? { aspectRatio: aspect } : undefined} className="h-32 w-auto max-w-full rounded-card border border-line bg-surface object-cover" />
          <div className="flex flex-wrap gap-2">
            {/* Loading, not disabled: a button that was used keeps the focus while the upload runs. */}
            <Button variant="secondary" size="sm" loading={uploading} disabled={disabled} onClick={() => input()?.click()}>
              {s.replaceImage}
            </Button>
            <Button variant="ghost" size="sm" disabled={uploading || disabled} onClick={remove}>
              {s.removeImage}
            </Button>
          </div>
        </div>
      )}
      {/* FileDrop's own file list never shows; its drop zone shows only while there is no image. */}
      <FileDrop
        accept={accept}
        maxSizeMb={maxSizeMb}
        disabled={disabled}
        id={id}
        aria-describedby={describedBy}
        aria-invalid={failed || undefined}
        onFilesChange={pick}
        className={cn("[&>ul]:hidden", value && "[&>label]:hidden")}
      />
      {uploading && (
        <p role="status" className="flex items-center gap-2 text-sm text-fg-2">
          <Spinner decorative className="h-4" />
          {s.uploading}
        </p>
      )}
      {failed && (
        <p role="alert" className="text-sm text-danger">
          {s.uploadFailed}
        </p>
      )}
      {name && <input type="hidden" name={name} value={value ?? ""} disabled={disabled} />}
    </div>
  );
}
