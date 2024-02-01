const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const multer = require("../middleware/multer-config");

const bookCtrl = require("../controllers/book");

router.put("/:id", auth, bookCtrl.modifyBook);
router.post("/", auth, multer, bookCtrl.createBook);
router.delete("/:id", auth, bookCtrl.deleteBook);
router.get("/bestrating", bookCtrl.getBestRatings);
router.get("/:id", bookCtrl.getOneBook);
router.get("/", bookCtrl.getAllBooks);

module.exports = router;
