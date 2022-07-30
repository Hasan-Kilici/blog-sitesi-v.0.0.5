const http = require("http");
const fs = require("fs");
const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const app = express();
const bodyParser = require("body-parser");
const server = http.createServer(app);
const path = require("path");

const cookieParser = require("cookie-parser");
const axios = require("axios");

app.use(cookieParser());
const port = 8080;

//Socket
const socketio = require("socket.io");
const io = new socketio.Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
//Upload file
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/data");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ".png");
  },
});
const upload = multer({ storage: storage });
app.post("/stats", upload.single("uploaded_file"), function (req, res) {
  console.log(req.file, req.body);
});
//Body Parser
app.use(bodyParser.json()).use(
  bodyParser.urlencoded({
    extended: true,
  })
);
//Statik
app.use(express.static("public"));
app.set("src", "path/to/views");
app.use("/uploads", express.static("public/data"));
//MongoDB
const dbURL = process.env.db;
mongoose
  .connect(dbURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => {
    server.listen(port, () => {
      console.log("mongoDB Bağlantı kuruldu");
    });
  })
  .catch((err) => console.log(err));
//Collections
let Blogs = require("./models/blogs.js");
let BlogsParts = require("./models/blogs-parts.js");
let Users = require("./models/users.js");
//viewPort
app.set("view engine", "ejs");
//DB Support
app.use(morgan("dev"));
//Pages
//Home
app.get("/", (req, res) => {
  var userId = req.params.id;
  Blogs.find()
    .sort({ createdAt: -1 })
    .then((BlogResult) => {
      if (userId != null) {
        //Signed Home
        Users.findById(userId)
          .then((UserResult) => {
            res.render(`${__dirname}/src/signed/index.ejs`, {
              title: `Anasayfa`,
              user: UserResult,
              blogs: BlogResult,
            });
          })
          .catch((err) => {
            res.clearCookie("id");
            res.render(`${__dirname}/src/pages/index.ejs`, {
              //Unsigned Home
              title: `Anasayfa`,
              blogs: BlogResult,
            });
          });
      } else {
        res.render(`${__dirname}/src/pages/index.ejs`, {
          //Unsigned Home
          title: `Anasayfa`,
          blogs: BlogResult,
        });
      }
    });
});
//Blog Page
app.get("/blog/:id", (req, res) => {
  let id = req.params.id;
  let userId = req.cookies.id;
  Blogs.findById(id).then((BlogResult) => {
    BlogsParts.find({ blogId: id }).then((PartsResult) => {
      if (userId != null) {
        Users.findById(userId).then((UserResult) => {
          res.redirect(`/user/blog/:id`);
        });
      } else {
        res.render(`${__dirname}/src/pages/blog.ejs`, {
          title: BlogResult.title,
          blog: BlogResult,
          blogpart: PartsResult,
        });
      }
    });
  });
});
//User Blog Page
app.get("/user/blog/:id", (req, res) => {
  let id = req.params.id;
  let userId = req.cookies.id;
  Users.findById(userId)
    .then((UserResult) => {
      Blogs.findById(id).then((BlogResult) => {
        BlogsParts.find({ blogId: id }).then((PartsResult) => {
          res.render(`${__dirname}/src/signed/blog.ejs`, {
            title: BlogResult.title,
            blog: BlogResult,
            blogpart: PartsResult,
            user: UserResult,
          });
        });
      });
    })
    .catch((err) => {
      res.redirect("/");
    });
});
//Staff Blog Page
app.get("/staff/blog/:id", (req, res) => {
  let id = req.params.id;
  let userId = req.cookies.id;
  Users.findById(userId)
    .then((UserResult) => {
      if (UserResult.staff == "true") {
        Blogs.findById(id).then((BlogResult) => {
          BlogsParts.find({ blogId: id }).then((PartsResult) => {
            res.render(`${__dirname}/src/staff/blog.ejs`, {
              title: BlogResult.title,
              blog: BlogResult,
              blogpart: PartsResult,
              user: UserResult,
            });
          });
        });
      } else {
        res.redirect("/");
      }
    })
    .catch((err) => {
      res.redirect("/");
    });
});
//Admin Blog Page
app.get("/admin/blog/:id", (req, res) => {
  let id = req.params.id;
  let userId = req.cookies.id;
  Users.findById(userId)
    .then((UserResult) => {
      if (UserResult.admin == "true") {
        Blogs.findById(id).then((BlogResult) => {
          BlogsParts.find({ blogId: id }).then((PartsResult) => {
            res.render(`${__dirname}/src/admin/blog.ejs`, {
              title: BlogResult.title,
              blog: BlogResult,
              blogparts: PartsResult,
              user: UserResult,
            });
          });
        });
      } else {
        res.redirect("/");
      }
    })
    .catch((err) => {
      res.redirect("/");
    });
});
//Login Page
app.get("/login", (req, res) => {
  var userId = req.cookies.id;
  if (userId != null) {
    Users.findById(userId)
      .then((UserResult) => {
        res.redirect("/");
      })
      .catch((err) => {
        res.clearCookie("id");
        res.render(`${__dirname}/src/pages/login.ejs`);
      });
  } else {
    res.render(`${__dirname}/src/pages/login.ejs`);
  }
});
//Register Page
app.get("/register", (req, res) => {
  var userId = req.cookies.id;
  if (userId != null) {
    Users.findById(userId)
      .then((UserResult) => {
        res.redirect("/");
      })
      .catch((err) => {
        res.clearCookie("id");
        res.render(`${__dirname}/src/pages/register.ejs`);
      });
  } else {
    res.render(`${__dirname}/src/pages/register.ejs`);
  }
});
//Dashboards
//Staff
app.get("/staff/dashboard/:id", (req, res) => {
  var id = req.params.id;
  var userId = req.cookies.id;
  if (id == userId) {
    Users.findById(id)
      .then((UserResult) => {
        Blogs.find({ staffId: id })
          .sort({ createdAt: -1 })
          .then((BlogResult) => {
            res.render(`${__dirname}/src/staff/dashboard.ejs`, {
              user: UserResult,
              blog: BlogResult,
              title: `${UserResult.username} Dashboard`,
            });
          });
      })
      .catch((err) => {
        res.redirect("/");
      });
  } else {
    res.redirect("/");
  }
});
//Admin
app.get("/admin/dashboard/:id", (req, res) => {
  var id = req.params.id;
  var userId = req.cookies.id;
  if (id == userId) {
    Users.findById(id)
      .then((UserResult) => {
        Blogs.find({ adminId: id })
          .sort({ createdAt: -1 })
          .then((BlogResult) => {
            res.render(`${__dirname}/src/admin/dashboard.ejs`, {
              user: UserResult,
              blog: BlogResult,
              title: `${UserResult.username} Dashboard`,
            });
          });
      })
      .catch((err) => {
        res.redirect("/");
      });
  } else {
    res.redirect("/");
  }
});
//Edit pages
//Staff
app.get("/staff/dashboard/edit-blog/:id", (req, res) => {
  let id = req.params.id;
  let userId = req.cookies.id;
  Blogs.findById(id).then((BlogResult) => {
    BlogsParts.find({ blogId: id }).then((PartsResult) => {
      Users.findById(userId).then((UserResult) => {
        if ((UserResult.staff = true)) {
          res.render(`${__dirname}/src/staff/edit-blog.ejs`, {
            title: `${BlogResult.title} Düzenle`,
            blog: BlogResult,
            blogpart: PartsResult,
            user: UserResult,
          });
        } else {
          res.redirect("/");
        }
      });
    });
  });
});
//Admin
//Actions
app.post("/add/blog/staff/:id", upload.single("uploaded_file"), (req, res) => {
  let id = req.params.id;
  Users.findById(id).then((UserResult) => {
    let blog = new Blogs({
      title: req.body.title,
      description: req.body.description,
      staffId: id,
      staff: UserResult.username,
      photo: req.file.filename,
      comments: 0,
    });
    blog.save().then((Result) => {
      res.redirect(`/staff/dashboard/${id}`);
    });
  });
});

app.post("/staff/remove/blog/:id", (req, res) => {
  let id = req.params.id;
  let userId = req.cookies.id;
  Blogs.findByIdAndDelete(id).then((Result) => {
    res.redirect(`/staff/dashboard/${userId}`);
  });
});

app.post(
  "/staff/add-part/blog/:id",
  upload.single("uploaded_file"),
  (req, res) => {
    let id = req.params.id;
    Blogs.findById(id).then((BlogResult) => {
      let newPart = BlogsParts({
        title: req.body.title,
        description: req.body.description,
        photo: req.file.filename,
        blogId: id,
      });
      newPart.save().then((Result) => {
        res.redirect(`/staff/dashboard/edit-blog/${id}`);
      });
    });
  }
);
