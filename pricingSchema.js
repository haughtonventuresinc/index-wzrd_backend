const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const priceSchema = new Schema({
    email: {
        type:String
    }
})

const pricing = new mongoose.model("pricing", priceSchema)

module.exports = pricing