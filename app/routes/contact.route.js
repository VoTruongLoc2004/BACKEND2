const express = require("express");
const contacts = require("../controllers/contact.controller");
const verifyToken = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/register", contacts.register);
router.post("/login", contacts.login);

router.use(verifyToken);

router
  .route("/")
  .get(contacts.findAll)
  .post(contacts.create)
  .delete(contacts.deleteAll);

router.route("/favorite").get(contacts.findAllFavorite);

router
  .route("/:id")
  .get(contacts.findOne)
  .put(contacts.update)
  .delete(contacts.delete);

module.exports = router;
