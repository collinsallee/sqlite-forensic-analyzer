interface ElectronAPI {
  saveFile: (fileData: number[], fileId: string) => Promise<{ success: boolean, filePath: string }>;
  readFile: (fileId: string, offset: number, length: number) => Promise<{ 
    data: string,
    offset: number,
    length: number,
    error?: string
  }>;
  editFile: (fileId: string, offset: number, hexValue: string) => Promise<{ success: boolean }>;
  getFileInfo: (fileId: string) => Promise<{
    file_id: string,
    file_size: number,
    file_name: string,
    creation_time: string,
    last_modified_time: string,
    error?: string
  }>;
  calculateFileHash: (fileId: string) => Promise<{
    md5_hash: string,
    sha1_hash: string,
    sha256_hash: string
  }>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {}; 