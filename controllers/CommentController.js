import PostModel from '../models/Post.js';
import CommentModel from '../models/Comment.js';

export const getLastComments = async (req, res) => {
  try {
    const comments = await CommentModel.find()
      .populate({ path: 'user', select: ['fullName', 'avatarUrl'] })
      .sort('createdAt')
      .limit(3)
      .exec();

    res.json(comments);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Не удалось получить комментарии',
    });
  }
};

export const getPostComments = async (req, res) => {
  const { postId } = req.params;

  await CommentModel.find({
    post: postId,
  })
    .populate({ path: 'user', select: ['fullName', 'avatarUrl'] })
    .populate({ path: 'post', select: ['title'] })
    .sort('createdAt')
    .then((doc) => {
      if (!doc) {
        return res.status(404).json({
          message: 'Статья не найдена',
        });
      }

      res.json(doc);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        message: 'Не удалось получить комментарии',
      });
    });
};

export const create = async (req, res) => {
  try {
    const doc = new CommentModel({
      text: req.body.text,
      user: req.userId,
      post: req.params.postId,
    });

    const comment = await doc.save();

    const { postId } = req.params;

    await PostModel.updateOne({ _id: postId }, { $push: { commentsCount: comment._id } }).exec();

    await CommentModel.find({
      post: postId,
    })
      .populate({ path: 'user', select: ['fullName', 'avatarUrl'] })
      .populate({ path: 'post', select: ['title'] })
      .sort('createdAt')
      .then((doc) => {
        if (!doc) {
          return res.status(404).json({
            message: 'Статья не найдена',
          });
        }

        res.json(doc);
      });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Не удалось добавить комментарий',
    });
  }
};

export const update = async (req, res) => {
  try {
    const { commentId } = req.params;

    await CommentModel.findOneAndUpdate(commentId, {
      $set: { ['text']: req.body.text },
    });

    res.json({
      success: true,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Не удалось отредактировать комментарий',
    });
  }
};

export const remove = async (req, res) => {
  const { commentId } = req.params;

  await CommentModel.findByIdAndDelete(commentId)
    .then((doc) => {
      if (!doc) {
        return res.status(404).json({
          message: 'Комментарий не найден',
        });
      }

      const postId = doc.post;

      PostModel.findOneAndUpdate(
        { _id: postId },
        { $pullAll: { commentsCount: [commentId] } },
        { new: true }
      )
        .clone()
        .catch((err) => {
          console.log(err);
          return res.status(500).json({
            message: 'Не удалось обновить счётчик комментариев',
          });
        });

      res.json({ success: true });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        message: 'Не удалось удалить комментарий',
      });
    });
};
