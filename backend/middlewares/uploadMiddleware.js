const multer = require('multer');

const storage = multer.memoryStorage();

const excelUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = new Set([
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream',
    ]);

    const lowerName = (file.originalname || '').toLowerCase();
    const hasExcelExtension = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls');

    if (hasExcelExtension || allowedMimeTypes.has(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new Error('Only Excel files (.xlsx or .xls) are allowed'));
  },
});

module.exports = {
  excelUpload,
};
