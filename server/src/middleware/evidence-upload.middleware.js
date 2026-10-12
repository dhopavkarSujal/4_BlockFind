
import multer from 'multer';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
    fields: 0,
    parts: 1,
  },
});

export function uploadEvidenceFile(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: 'Evidence files cannot exceed 5 MB',
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid upload. Submit one file using the field name "file".',
      });
    }

    console.error('Evidence upload parsing failed:', error);

    return res.status(400).json({
      success: false,
      message: 'Could not process the evidence upload',
    });
  });
}
