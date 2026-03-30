const ContactService = require("../services/contact.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.create = async (req, res, next) => {
  if (!req.body?.name) {
    return next(new ApiError(400, "Name can not be empty"));
  }

  try {
    const contactService = new ContactService(MongoDB.client);
    const document = await contactService.create({
      ...req.body,
      ownerId: req.userId,
    });
    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(500, "An error occurred while creating the contact"),
    );
  }
};

exports.findAll = async (req, res, next) => {
  let documents = [];
  try {
    const contactService = new ContactService(MongoDB.client);
    const { name } = req.query;

    const filter = { ownerId: req.userId };

    if (name) {
      documents = await contactService.find({
        ...filter,
        name: { $regex: new RegExp(name), $options: "i" },
      });
    } else {
      documents = await contactService.find(filter);
    }
  } catch (error) {
    return next(
      new ApiError(500, "An error occurred while retrieving contacts"),
    );
  }
  return res.send(documents);
};

exports.findOne = async (req, res, next) => {
  try {
    const contactService = new ContactService(MongoDB.client);
    const document = await contactService.findById(req.params.id, req.userId);
    if (!document) {
      return next(new ApiError(404, "Contact not found"));
    }
    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(500, `Error retrieving contact with id=${req.params.id}`),
    );
  }
};

exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Data to update can not be empty"));
  }

  try {
    const contactService = new ContactService(MongoDB.client);
    const document = await contactService.update(
      req.params.id,
      req.body,
      req.userId,
    );
    if (!document) {
      return next(new ApiError(404, "Contact not found"));
    }
    return res.send({ message: "Contact was updated successfully" });
  } catch (error) {
    return next(
      new ApiError(500, `Error updating contact with id=${req.params.id}`),
    );
  }
};

exports.delete = async (req, res, next) => {
  try {
    const contactService = new ContactService(MongoDB.client);
    const document = await contactService.delete(req.params.id, req.userId);
    if (!document) {
      return next(new ApiError(404, "Contact not found"));
    }
    return res.send({ message: "Contact was deleted successfully" });
  } catch (error) {
    return next(
      new ApiError(500, `Error not delete contact with id=${req.params.id}`),
    );
  }
};

exports.findAllFavorite = async (req, res, next) => {
  try {
    const contactService = new ContactService(MongoDB.client);
    const documents = await contactService.find({
      favorite: true,
      ownerId: req.userId,
    });
    return res.send(documents);
  } catch (error) {
    return next(
      new ApiError(500, `An error occurred while retrieving favorite contacts`),
    );
  }
};

exports.deleteAll = async (req, res, next) => {
  try {
    const contactService = new ContactService(MongoDB.client);
    const deletedCount = await contactService.deleteAll(req.userId);
    return res.send({
      message: `${deletedCount} contacts were deleted successfully`,
    });
  } catch (error) {
    return next(
      new ApiError(500, "An error occurred while removing all contacts"),
    );
  }
};

exports.register = async (req, res, next) => {
  if (!req.body?.username || !req.body?.password) {
    return next(new ApiError(400, "Username and password are required"));
  }

  try {
    const userColl = MongoDB.client.db().collection("users");
    const existingUser = await userColl.findOne({
      username: req.body.username,
    });

    if (existingUser) {
      return next(new ApiError(400, "Username already exists"));
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    await userColl.insertOne({
      username: req.body.username,
      password: hashedPassword,
    });

    return res.send({ message: "User registered successfully" });
  } catch (error) {
    return next(new ApiError(500, "Error occurred while registering user"));
  }
};

exports.login = async (req, res, next) => {
  try {
    const userColl = MongoDB.client.db().collection("users");
    const user = await userColl.findOne({ username: req.body.username });

    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      return next(new ApiError(401, "Invalid username or password"));
    }

    const token = jwt.sign({ id: user._id }, "contactbook_secret_key", {
      expiresIn: "24h",
    });

    return res.send({
      id: user._id,
      username: user.username,
      accessToken: token,
    });
  } catch (error) {
    return next(new ApiError(500, "Error occurred during login"));
  }
};
