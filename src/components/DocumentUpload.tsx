"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DocumentUpload({ onUploadSuccess }: { onUploadSuccess: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError("");
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file first.");
            return;
        }

        setUploading(true);
        setError("");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/documents/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Upload failed");
            }

            setFile(null);
            // Reset file input value if possible, or just rely on state
            const fileInput = document.getElementById("file-upload") as HTMLInputElement;
            if (fileInput) fileInput.value = "";

            onUploadSuccess();
            router.refresh();
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Something went wrong");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="card" style={{ maxWidth: "100%", marginBottom: "2rem" }}>
            <h3 className="title" style={{ fontSize: "1.2rem", textAlign: "left" }}>Upload Document</h3>
            <div className="form-group">
                <label className="label" htmlFor="file-upload">
                    Select PDF or Text file
                </label>
                <input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.txt,.md"
                    onChange={handleFileChange}
                    className="input"
                    disabled={uploading}
                />
            </div>
            {error && <p className="error-message">{error}</p>}
            <button
                onClick={handleUpload}
                className="button"
                disabled={!file || uploading}
            >
                {uploading ? "Uploading..." : "Upload Document"}
            </button>
        </div>
    );
}
