import multer from "multer";
import type { Request, Response, NextFunction } from "express";

const storage = multer.memoryStorage();
export const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

export function attachFileAsBase64(dbField: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.file) {
      const mimeType = req.file.mimetype || "application/octet-stream";
      (req.body as Record<string, string>)[dbField] =
        `data:${mimeType};base64,${req.file.buffer.toString("base64")}`;
    }
    next();
  };
}
