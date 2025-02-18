const { auth, bucket } = require("../config/firebase");

exports.update = async (req, res) => {
  const { id } = req.params;
  try {
    const {
      name,
      surname,
      displayName,
      phoneNumber,
      email,
      dateOfBirth,
      bio,
      speciality,
      category,
      extraAmount,
    } = req.body;
    if (JSON.stringify(req.body) === "{}" && typeof req.file === "undefined") {
      res.status(500).json({ error: "Must have atleast one field to update" });
    }
    let updateObj = {};
    if (req.file !== "undefined") {
      try {
        //upload image and get url

        const buffer = req.file.buffer;
        const extension = req.file.originalname.substring(
          req.file.originalname.indexOf(".") + 1
        );
        const file = bucket.file("profile-pictures/" + id + "." + extension);
        const resp = await file.save(buffer, {});
        const imageUrl = await file.getSignedUrl({
          action: "read",
          expires: "03-09-2491",
        });

        updateObj.profilePicture = imageUrl;
      } catch (err) {}
    }
    if (name !== "" && typeof name !== "undefined") {
      updateObj.name = name;
    }
    if (surname !== "" && typeof surname !== "undefined") {
      updateObj.surname = surname;
    }
    if (displayName !== "" && typeof displayName !== "undefined") {
      updateObj.surname = surname;
    }
    if (phoneNumber !== "" && typeof phoneNumber !== "undefined") {
      updateObj.phoneNumber = phoneNumber;
    }
    if (email !== "" && typeof email !== "undefined") {
      updateObj.email = email;
    }
    if (dateOfBirth !== "" && typeof dateOfBirth !== "undefined") {
      updateObj.dateOfBirth = dateOfBirth;
    }
    if (bio !== "" && typeof bio !== "undefined") {
      updateObj.bio = bio;
    }
    if (speciality !== "" && typeof speciality !== "undefined") {
      updateObj.speciality = speciality;
    }
    if (category !== "" && typeof category !== "undefined") {
      updateObj.category = category;
    }
    if (extraAmount !== "" && typeof extraAmount !== "undefined") {
      updateObj.extraAmount = extraAmount;
    }

    if (JSON.stringify(updateObj) !== "{}") {
      try {
        const result = await db.collection("users").doc(id).update(updateObj);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }

    res.status(201).json({ message: "User has been updated succesfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occured during update" });
  }
};
