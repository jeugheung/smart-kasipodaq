import * as DocumentPicker from "expo-document-picker";
import { useState, useCallback } from "react";
import { getOrCreateUUID } from "../../../shared/lib/uuid";
import { API_CONFIG } from "../../../shared/api/config";

export type UploadFile = {
  uri: string;
  name: string;
  type: string;
  progress: number;
  serverPath?: string;
};

export const useFileUpload = () => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const uploadSingleFile = useCallback(async (file: UploadFile) => {
    setUploading(true);
    const uuid = await getOrCreateUUID();

    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();

      formData.append("files", {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setFiles((prev) =>
            prev.map((f) => (f.uri === file.uri ? { ...f, progress } : f))
          );
        }
      };

      xhr.onload = () => {
        try {
          const res = JSON.parse(xhr.response);
          if (xhr.status >= 200 && xhr.status < 300) {
            const serverPath = res.files?.[0] || res.path || res.url;
            setFiles((prev) =>
              prev.map((f) =>
                f.uri === file.uri ? { ...f, progress: 100, serverPath } : f
              )
            );
            resolve();
          } else {
            reject(new Error("Upload failed"));
          }
        } catch (e) {
          reject(e);
        }
      };

      xhr.onerror = (e) => reject(e);
      xhr.open("POST", `${API_CONFIG.UPLOAD_FILES_API}?uuid=${uuid}`);
      xhr.send(formData);
    }).finally(() => setUploading(false));
  }, []);

  const pickFiles = async () => {
    const res = await DocumentPicker.getDocumentAsync({ multiple: true });
    if (res.canceled) return;

    const mapped = res.assets.map((f) => ({
      uri: f.uri,
      name: f.name,
      type: f.mimeType || "application/octet-stream",
      progress: 0,
    }));

    setFiles((p) => [...p, ...mapped]);
    mapped.forEach(uploadSingleFile);
  };

  return { files, uploading, pickFiles, setFiles, uploadSingleFile };
};