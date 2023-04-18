import fs from 'fs';
import cors from 'cors';
import multer from 'multer';
import express from 'express';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

import { checkAuth, handleValidationErrors } from './utils/index.js';
import { UserController, PostController, CommentController } from './controllers/index.js';
import {
  commentCreateValidation,
  loginValidation,
  postCreateValidation,
  registerValidation,
} from './validations.js';

dotenv.config();

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('DB ok'))
  .catch((err) => console.log('DB error', err));

const app = express();

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }
    cb(null, 'uploads');
  },
  filename: (_, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));

app.get('/auth/me', checkAuth, UserController.getMe);
app.post('/auth/login', loginValidation, handleValidationErrors, UserController.login);
app.post('/auth/register', registerValidation, handleValidationErrors, UserController.register);

app.post('/upload', checkAuth, upload.single('image'), (req, res) => {
  res.json({
    url: `/uploads/${req.file.originalname}`,
  });
});

app.get('/posts', PostController.getAll);
app.get('/posts/:id', PostController.getOne);
app.post('/posts', checkAuth, postCreateValidation, handleValidationErrors, PostController.create);
app.patch(
  '/posts/:id',
  checkAuth,
  postCreateValidation,
  handleValidationErrors,
  PostController.update
);
app.delete('/posts/:id', checkAuth, PostController.remove);

app.get('/tags', PostController.getLastTags);
app.get('/tags/:tag', PostController.getAllByTag);

app.get('/comments', CommentController.getLastComments);
app.get('/comments/:postId', CommentController.getPostComments);
app.post(
  '/comments/:postId',
  checkAuth,
  commentCreateValidation,
  handleValidationErrors,
  CommentController.create
);
app.patch(
  '/comments/:commentId',
  checkAuth,
  commentCreateValidation,
  handleValidationErrors,
  CommentController.update
);
app.delete('/comments/:commentId', checkAuth, CommentController.remove);

app.listen(process.env.PORT || 4444, (err) => {
  if (err) {
    return console.log(err);
  }

  console.log('Server OK');
});
