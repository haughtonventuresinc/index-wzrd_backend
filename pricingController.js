const { data } = require("autoprefixer");
const PRICING = require("./pricingSchema");

const postEmail = async (req, res) => {
  try {
    const email = new PRICING({
      email: req.body.email,
    });

    const result = await email.save();
    res.status(200).json({
      message: "Email Saved Successfully",
      status: 200,
      data: result,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

const getEmail = async (req, res) => {
  try {
    const email = await PRICING.findOne({ email: req.body.email });
    console.log(email);

    if (email) {
      res.status(200).json({
        message: "Email fetched Successfully",
        status: 200,
        data: email,
      });
      return
    } else {
      res.status(400).json({
        status: 400,
        message: "Could not get email",
        data: null,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

module.exports = { getEmail, postEmail };
