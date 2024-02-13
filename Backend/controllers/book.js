const Book = require("../models/Book.js");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject._userId;

  const originalImagePath = req.file.path;

  const compressedImagePath = `${originalImagePath
    .split(".")
    .slice(0, -1)
    .join(".")}-compressed.jpg`;

  sharp(originalImagePath)
    .jpeg({ quality: 80 })
    .toFile(compressedImagePath)
    .then(() => {
      fs.unlinkSync(originalImagePath);

      const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get(
          "host"
        )}/images/${compressedImagePath.split("/").pop()}`,
      });

      return book.save();
    })
    .then(() => {
      res.status(201).json({ message: "Livre enregistré !" });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.modifyBook = (req, res, next) => {
  let bookObject = { ...req.body };

  if (req.file) {
    bookObject = {
      ...JSON.parse(req.body.book),
      imageUrl: `${req.protocol}://${req.get(
        "host"
      )}/images/${req.file.filename.replace(".jpg", "-compressed.jpg")}`,
    };
  }

  delete bookObject._userId;

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      if (book.userId !== req.auth.userId) {
        return res.status(401).json({ message: "Non autorisé" });
      }

      if (req.file) {
        const oldImagePath = path.join(
          __dirname,
          "..",
          "images",
          book.imageUrl.split("/images/")[1]
        );

        const originalImagePath = req.file.path;
        const compressedImagePath = `${originalImagePath
          .split(".")
          .slice(0, -1)
          .join(".")}-compressed.jpg`;

        sharp(originalImagePath)
          .resize({ fit: "inside", width: 800 })
          .toFile(compressedImagePath)
          .then(() => {
            fs.unlink(oldImagePath, (err) => {
              if (err && err.code !== "ENOENT") {
                console.error(
                  "Erreur lors de la suppression de l'ancienne image :",
                  err
                );
              }
            });

            fs.unlink(originalImagePath, (err) => {
              if (err && err.code !== "ENOENT") {
                console.error(
                  "Erreur lors de la suppression de la nouvelle image originale :",
                  err
                );
              }
            });

            const compressedImageFilename =
              req.file.filename.replace(/\.(jpeg|png|jpg)$/, "") +
              "-compressed.jpg";

            const compressedImageUrl = `${req.protocol}://${req.get(
              "host"
            )}/images/${compressedImageFilename}`;

            Book.updateOne(
              { _id: req.params.id },
              {
                ...bookObject,
                _id: req.params.id,
                imageUrl: compressedImageUrl,
              }
            )
              .then(() => {
                res.status(200).json({ message: "Livre modifié" });
              })
              .catch((error) => {
                res.status(500).json({ error });
              });
          })
          .catch((error) => {
            console.error("Erreur lors de la compression de l'image :", error);
            res.status(500).json({ error });
          });
      } else {
        Book.updateOne(
          { _id: req.params.id },
          { ...bookObject, _id: req.params.id }
        )
          .then(() => {
            res.status(200).json({ message: "Livre modifié" });
          })
          .catch((error) => {
            res.status(500).json({ error });
          });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      if (book.userId !== req.auth.userId) {
        return res.status(401).json({ message: "Non autorisé" });
      }
      const filename = book.imageUrl.split("/images/")[1];
      const imagePath = `images/${filename}`;
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error("Erreur lors de la suppression de l'image :", err);
          return res
            .status(500)
            .json({ message: "Erreur lors de la suppression de l'image" });
        }
        Book.deleteOne({ _id: req.params.id })
          .then(() => {
            res.status(200).json({ message: "Livre supprimé !" });
          })
          .catch((error) => {
            res.status(500).json({ error });
          });
      });
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      if (book.userId !== req.auth.userId) {
        return res.status(401).json({ message: "Non autorisé" });
      }
      const filename = book.imageUrl.split("/images/")[1];
      const imagePath = path.join(__dirname, "..", "images", filename); // Chemin absolu du fichier image
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error("Erreur lors de la suppression de l'image :", err);
          return res
            .status(500)
            .json({ message: "Erreur lors de la suppression de l'image" });
        }
        Book.deleteOne({ _id: req.params.id })
          .then(() => {
            res.status(200).json({ message: "Livre supprimé !" });
          })
          .catch((error) => {
            res.status(500).json({ error });
          });
      });
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error }));
};

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};

exports.getBestRatings = (req, res, next) => {
  Book.find()
    .then((books) => {
      const bestBooks = books
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 3);
      res.status(200).json(bestBooks);
    })
    .catch((error) => res.status(500).json({ error }));
};

exports.rateBook = async (req, res, next) => {
  const bookId = req.params.id;
  const userId = req.auth.userId;
  const { rating } = req.body;

  try {
    const existingRating = await Book.findOne({
      _id: bookId,
      "ratings.userId": userId,
    });

    if (existingRating) {
      return res.status(400).json({ message: "Vous avez déjà noté ce livre." });
    }

    const updatedBook = await Book.findByIdAndUpdate(
      bookId,
      {
        $push: {
          ratings: { userId: userId, grade: rating },
        },
      },
      { new: true }
    );

    if (!updatedBook) {
      return res.status(404).json({ message: "Livre non trouvé" });
    }

    const totalRatings = updatedBook.ratings.length;
    const totalGrades = updatedBook.ratings.reduce(
      (acc, curr) => acc + curr.grade,
      0
    );
    updatedBook.averageRating =
      totalRatings > 0 ? (totalGrades / totalRatings).toFixed(1) : 0;

    await updatedBook.save();

    res.status(200).json(updatedBook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
