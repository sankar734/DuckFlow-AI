import { Router } from 'express';
import { documentController } from '../controllers/documentController';
import { authenticate } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';
import { sendSuccess } from '../utils/responseFormatter';

const router = Router();

router.use(authenticate);

// Documents CRUD
router.get('/', (req, res, next) => documentController.getDocuments(req, res, next));
router.get('/recent', (req, res, next) => documentController.getRecent(req, res, next));
router.get('/trash', (req, res, next) => documentController.getTrash(req, res, next));
router.get('/:id', (req, res, next) => documentController.getDocumentById(req, res, next));
router.post('/', (req, res, next) => documentController.createDocument(req, res, next));
router.patch('/:id', (req, res, next) => documentController.updateDocument(req, res, next));
router.post('/:id/trash', (req, res, next) => documentController.moveToTrash(req, res, next));
router.post('/:id/restore', (req, res, next) => documentController.restoreFromTrash(req, res, next));
router.delete('/:id', (req, res, next) => documentController.permanentDelete(req, res, next));

// Versions
router.get('/:id/versions', (req, res, next) => documentController.getVersions(req, res, next));
router.post('/:id/versions/:versionNumber/restore', (req, res, next) => documentController.restoreVersion(req, res, next));

// Folders
router.get('/folders/all', (req, res, next) => documentController.getFolders(req, res, next));
router.post('/folders', (req, res, next) => documentController.createFolder(req, res, next));

// File Upload
router.post('/upload', upload.single('file'), (req: any, res) => {
  const file = req.file;
  sendSuccess(res, {
    fileName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    storageKey: file.filename,
    downloadUrl: `/uploads/${file.filename}`,
  }, 'File uploaded successfully', 201);
});

export default router;
