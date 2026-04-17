const multer = require('multer');

const storage = multer.memoryStorage();
const MAX_EXCEL_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const isExcelFile = (file = {}) => {
  const allowedMimeTypes = new Set([
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/octet-stream',
  ]);

  const lowerName = String(file.originalname || '').toLowerCase();
  const hasExcelExtension = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls');

  return hasExcelExtension || allowedMimeTypes.has(file.mimetype);
};

const createExcelUpload = () =>
  multer({
    storage,
    limits: { fileSize: MAX_EXCEL_FILE_SIZE },
    fileFilter: (req, file, cb) => {
      if (isExcelFile(file)) {
        cb(null, true);
        return;
      }

      cb(new Error('Only Excel files (.xlsx or .xls) are allowed'));
    },
  });

const excelUpload = createExcelUpload();
const excelImportUpload = createExcelUpload().single('file');

module.exports = {
  excelUpload,
  excelImportUpload,
};
