import React, { useState, useRef, Fragment, useEffect } from "react";
import type { ChangeEvent } from "react";
import NavBar from "./components/ui/NavBar";
import IQ from "/images/IQ.png";
import { v4 as uuidv4 } from "uuid";
interface Metadata {
  [key: string]: string | number | null | undefined;
}

interface ClassificationResult {
  filename: string;
  label?: string;
  inferred_label?: string;
  metadata?: Metadata;
  pii_type?: string;
  table?: string;
  column?: string;
  value?: string | number | null;
  showMetadata?: boolean;
}

const App: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ClassificationResult[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [mode, setMode] = useState<"classify" | "metadata">("classify");
  const [scanContext, setScanContext] = useState<"document" | "db">(
    "document"
  );

  const [dbConnString, setDbConnString] = useState<string>("");
  const [dbScanType, setDbScanType] = useState<
    "pii-meta" | "pii-full" | "pii-table"
  >("pii-full");
  const [tableName, setTableName] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);
  const requestId = useRef<string>(uuidv4());

  // Reset results when switching context
  useEffect(() => {
    setResults([]);
  }, [scanContext]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const toggleMetadata = (index: number) => {
    setResults((prev) =>
      prev.map((res, i) =>
        i === index ? { ...res, showMetadata: !res.showMetadata } : res
      )
    );
  };

  const upload = async (scanType: "classify" | "metadata") => {
    if (files.length === 0 || loading) return;

    setLoading(true);
    setMode(scanType);
    setProgress(10);
    setResults([]);

    const id = uuidv4();
    requestId.current = id;

    // close previous socket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // open new WS
    const socket = new WebSocket("ws://localhost:3000");
    wsRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ id, type: scanType }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.requestId !== id) return;

      if (data.done) {
        socket.close();
        return;
      }

      // append batch
      setResults((prev) => [
        ...prev,
        ...data.batch.map((r: any) => ({ ...r, showMetadata: false })),
      ]);
      setProgress((prev) => Math.min(prev + 15, 95));
    };

    socket.onerror = (e) => {
      console.error("WebSocket error:", e);
      setLoading(false);
      setProgress(0);
      socket.close();
    };

    socket.onclose = () => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 500);
    };

    // send upload request
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    try {
      await fetch(
        `http://localhost:3000/upload?id=${id}&type=${scanType}`,
        {
          method: "POST",
          body: formData,
        }
      );
    } catch (err) {
      console.error("Upload failed:", err);
      setLoading(false);
      setProgress(0);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    }
  };

  const runDbScan = async () => {
    if (!dbConnString) return;
    setLoading(true);
    setResults([]);

    try {
      const res = await fetch("http://localhost:3000/pii", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conn_string: dbConnString,
          type: dbScanType,
          table: dbScanType === "pii-table" ? tableName : undefined,
        }),
      });
      const json = await res.json();
      setResults(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      console.error("DB scan failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavBar logoSrc={IQ} />
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-center mb-6 text-blue-700">
            ID Scanner
          </h1>

          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => setScanContext("document")}
              className={`px-4 py-2 rounded ${
                scanContext === "document"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-300"
              }`}
            >
              Document Scan
            </button>
            <button
              onClick={() => setScanContext("db")}
              className={`px-4 py-2 rounded ${
                scanContext === "db" ? "bg-blue-600 text-white" : "bg-gray-300"
              }`}
            >
              DB Scan
            </button>
          </div>

          {scanContext === "document" && (
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
              <label
                htmlFor="file-upload"
                className="text-sm font-medium text-gray-700"
              >
                Upload Images
              </label>
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="block w-full md:w-auto border border-gray-300 rounded px-4 py-2 bg-white shadow-sm"
              />

              <button
                onClick={() => upload("classify")}
                className="bg-green-600 text-white font-semibold px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                disabled={loading || files.length === 0}
              >
                ML Scan
              </button>
              <button
                onClick={() => upload("metadata")}
                className="bg-purple-600 text-white font-semibold px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                disabled={loading || files.length === 0}
              >
                Filename-based Scan
              </button>
            </div>
          )}

          {scanContext === "db" && (
            <div className="space-y-4 mb-6">
              <label className="block text-sm font-medium text-gray-700">
                DB Connection String
              </label>
              <input
                type="text"
                value={dbConnString}
                onChange={(e) => setDbConnString(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />

              <label className="block text-sm font-medium text-gray-700">
                Scan Type
              </label>
              <select
                value={dbScanType}
                onChange={(e) =>
                  setDbScanType(e.target.value as typeof dbScanType)
                }
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="pii-meta">Metadata Only</option>
                <option value="pii-full">Full Scan</option>
                <option value="pii-table">Single Table</option>
              </select>

              {dbScanType === "pii-table" && (
                <>
                  <label className="block text-sm font-medium text-gray-700">
                    Table Name
                  </label>
                  <input
                    type="text"
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="e.g. users_basic"
                  />
                </>
              )}

              <button
                onClick={runDbScan}
                className="bg-green-600 text-white font-semibold px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                disabled={loading || !dbConnString}
              >
                Run DB Scan
              </button>
            </div>
          )}

          {loading && (
            <div className="w-full bg-gray-200 h-3 rounded overflow-hidden mb-6 mt-6">
              <div
                className="bg-blue-600 h-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {results.length > 0 && (
            <div className="overflow-x-auto mt-6">
              <table className="min-w-full bg-white border border-gray-300 rounded-lg overflow-hidden">
                <thead className="bg-gray-200 text-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left">Sl. No</th>
                    <th className="px-4 py-2 text-left">Source</th>
                    <th className="px-4 py-2 text-left">
                      Label / PII Type
                    </th>
                    <th className="px-4 py-2 text-left">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((res, idx) => (
                    <Fragment key={`${res.filename}-${idx}`}>
                      <tr className="border-t bg-white hover:bg-gray-50 transition">
                        <td className="px-4 py-3">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {res.filename || res.table || "-"}
                        </td>
                        <td className="px-4 py-3">
                          {scanContext === "document"
                            ? mode === "classify"
                              ? res.label || "-"
                              : res.inferred_label || "-"
                            : res.pii_type || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <button
                            onClick={() => toggleMetadata(idx)}
                            className="text-blue-600 underline"
                          >
                            {res.showMetadata ? "Hide" : "Show"} Details
                          </button>
                        </td>
                      </tr>

                      {res.showMetadata && (
                        <tr className="bg-gray-100 border-t">
                          <td colSpan={4} className="px-6 py-4 text-xs">
                            <div className="bg-white rounded border p-3 shadow-sm max-w-4xl overflow-x-auto">
                              <pre className="whitespace-pre-wrap break-words text-xs text-gray-800">
                                {JSON.stringify(
                                  res.metadata || {
                                    table: res.table,
                                    column: res.column,
                                    value: res.value,
                                  },
                                  null,
                                  2
                                )}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default App;