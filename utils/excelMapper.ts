import * as XLSX from 'xlsx';

export interface StudentImportRow {
  cccd: string;
  ho_ten: string;
  ngay_sinh?: string;
  gioi_tinh?: string;
  so_dien_thoai?: string;
  email?: string;
  lop?: string;
  khoa?: string;
}

// Đọc và chuyển file Excel thành JSON
export const parseExcelFile = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

// Xuất dữ liệu ra file Excel
export const exportToExcel = (data: any[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Dữ liệu');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};