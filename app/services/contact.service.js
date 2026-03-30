const { ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");

class ContactService {
  constructor(client) {
    this.client = client;
    this.Contact = client.db().collection("contacts");
  }

  extractContactData(payload) {
    const contact = {
      name: payload.name,
      email: payload.email,
      address: payload.address,
      phone: payload.phone,
      favorite: payload.favorite,
      ownerId: payload.ownerId,
      hobbies: payload.hobbies,
    };
    Object.keys(contact).forEach(
      (key) => contact[key] === undefined && delete contact[key],
    );
    return contact;
  }

  async create(payload) {
    const contact = this.extractContactData(payload);
    const result = await this.Contact.findOneAndUpdate(
      {
        name: contact.name,
        email: contact.email,
        ownerId: contact.ownerId,
      },
      { $set: contact },
      { returnDocument: "after", upsert: true },
    );
    return result;
  }

  async find(filter) {
    const cursor = await this.Contact.find(filter);
    return await cursor.toArray();
  }

  async findById(id, ownerId) {
    return await this.Contact.findOne({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
      ownerId: ownerId,
    });
  }

  async update(id, payload) {
    const update = this.extractContactData(payload);
    const filter = {
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
      ownerId: update.ownerId,
    };

    const result = await this.Contact.findOneAndUpdate(
      filter,
      { $set: update },
      { returnDocument: "after" },
    );
    return result;
  }

  async delete(id, ownerId) {
    const result = await this.Contact.findOneAndDelete({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
      ownerId: ownerId,
    });
    return result;
  }

  async deleteAll(ownerId) {
    const result = await this.Contact.deleteMany({ ownerId: ownerId });
    return result.deletedCount;
  }

  async createUser(payload) {
    const user = {
      username: payload.username,
      password: await bcrypt.hash(payload.password, 10),
    };
    const result = await this.client
      .db()
      .collection("users")
      .findOneAndUpdate(
        { username: user.username },
        { $setOnInsert: user },
        { upsert: true, returnDocument: "after" },
      );
    return result;
  }

  async findUserByUsername(username) {
    return await this.client.db().collection("users").findOne({ username });
  }
}

module.exports = ContactService;
