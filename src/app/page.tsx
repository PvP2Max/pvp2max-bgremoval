"use client";

import { useEffect, useRef, useState } from "react";

type Stage = "idle" | "processing" | "done";

const serviceToken = process.env.NEXT_PUBLIC_DEFAULT_SERVICE_TOKEN ?? "";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [resultPreview, setResultPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<Stage>("idle");
  const [message, setMessage] = useState("Upload an image to begin");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(
    () => () => {
      if (originalPreview) URL.revokeObjectURL(originalPreview);
      if (resultPreview?.startsWith("blob:")) URL.revokeObjectURL(resultPreview);
    },
    [originalPreview, resultPreview],
  );

  const handleFileSelect = (files: FileList | null) => {
    if (!files?.[0]) return;
    const selectedFile = files[0];
    if (originalPreview) URL.revokeObjectURL(originalPreview);

    setFile(selectedFile);
    setResultPreview(null);
    setError(null);
    setStatus("idle");
    setMessage("Ready to remove the background");
    setOriginalPreview(URL.createObjectURL(selectedFile));
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    handleFileSelect(event.dataTransfer.files);
  };

  const downloadResult = () => {
    if (!resultPreview) return;
    const link = document.createElement("a");
    link.href = resultPreview;
    link.download = "background-removed.png";
    link.click();

    // Clear previews and revoke URLs to avoid lingering client-side blobs.
    if (originalPreview) {
      URL.revokeObjectURL(originalPreview);
    }
    if (resultPreview.startsWith("blob:")) {
      URL.revokeObjectURL(resultPreview);
    }
    setOriginalPreview(null);
    setResultPreview(null);
    setFile(null);
  };

  const runRemoval = async () => {
    if (!file) {
      setError("Choose an image before processing");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setStatus("processing");
    setError(null);
    setMessage("Uploading to withoutbg service...");

    try {
      const response = await fetch("/api/remove-background", {
        method: "POST",
        headers: serviceToken
          ? {
              Authorization: `Bearer ${serviceToken}`,
            }
          : undefined,
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Background removal failed");
      }

      if (!payload?.imageBase64) {
        throw new Error("withoutbg response missing image data");
      }

      const contentType = payload.contentType || "image/png";
      const dataUrl = `data:${contentType};base64,${payload.imageBase64}`;

      setResultPreview(dataUrl);
      setStatus("done");
      setMessage("Background removed. Download or compare below.");
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Unexpected error";
      setError(message);
      setStatus("idle");
      setMessage("Retry when you are ready.");
    }
  };

  const canProcess = Boolean(file && status !== "processing");

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute left-1/2 top-32 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute -right-10 bottom-10 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 sm:px-10">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                Background removal built on withoutbg
              </h1>
              <p className="max-w-3xl text-lg text-slate-300">
                Upload an image to get started.
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-500/5 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-300">Workflow</p>
                <h2 className="text-2xl font-semibold">Upload & process</h2>
              </div>
              <div className="text-sm text-emerald-200">
                {status === "processing" ? "Processing..." : "Idle"}
              </div>
            </div>

            <label
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`mt-5 flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed p-8 text-center transition duration-200 ${
                isDragging
                  ? "border-cyan-300 bg-cyan-500/10"
                  : "border-white/20 bg-white/5"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleFileSelect(event.target.files)}
              />
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-200">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 16.5c-1.657 0-3-1.343-3-3 0-1.56 1.19-2.846 2.72-2.988C6.27 8.61 8.418 7 11 7c2.99 0 5.5 2.239 5.5 5 0 .37-.04.73-.12 1.076C17.933 13.084 19 14.248 19 15.67 19 17.003 17.88 18 16.6 18H6Z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 11v7m0-7-2.5 2.5M12 11l2.5 2.5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-medium">
                  Drop an image or choose a file
                </p>
                <p className="text-sm text-slate-300">
                  PNG, JPG, and HEIC are supported.
                </p>
              </div>
              {file ? (
                <div className="rounded-full bg-black/30 px-4 py-2 text-xs text-slate-200">
                  {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                >
                  Browse files
                </button>
              )}
            </label>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-50 transition hover:border-cyan-300/50 hover:bg-white/20"
              >
                Choose another file
              </button>
              <button
                type="button"
                disabled={!canProcess}
                onClick={runRemoval}
                className="rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-300 px-5 py-2 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "processing" ? "Processing..." : "Remove background"}
              </button>
              {resultPreview && (
                <button
                  type="button"
                  onClick={downloadResult}
                  className="rounded-full border border-emerald-300/50 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-200 hover:bg-emerald-500/25"
                >
                  Download result
                </button>
              )}
            </div>

            <div className="mt-4 space-y-1 text-sm text-slate-200">
              <p className="font-semibold text-slate-50">{message}</p>
              {error ? (
                <p className="text-rose-200">{error}</p>
              ) : (
                <p className="text-slate-400">
                  Background removal runs through the internal pipeline.
                </p>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Preview</h3>
                <span className="text-xs text-slate-300">Before / After</span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <p className="text-sm text-slate-300">Original</p>
                  <div className="mt-2 aspect-video overflow-hidden rounded-xl bg-slate-900/50">
                    {originalPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={originalPreview}
                        alt="Original upload preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-500">
                        Waiting for upload
                      </div>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <p className="text-sm text-slate-300">Processed</p>
                  <div className="mt-2 aspect-video overflow-hidden rounded-xl bg-slate-900/50">
                    {resultPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resultPreview}
                        alt="Image with background removed"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-500">
                        Run the remover to view results
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
