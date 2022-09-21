const express = require("express");
const fs = require("fs");
const path = require("path");

const basicAuth = require("express-basic-auth");
const bcrypt = require("bcrypt");
const app = express();
const port = 3000;
const binomialTest = require ('@stdlib/stats-binomial-test')
var binomResult = ""

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static("public"));

const cookieParser = require("cookie-parser");
const { runInNewContext, runInThisContext } = require('vm')
app.use(cookieParser());

const clearPasswordAuthorizer = (username, password, cb) => {
  parseCsvWithHeader("./users.csv", (err, users) => {
    const storedUser = users.find((possibleUser) => {
      return basicAuth.safeCompare(username, possibleUser.username);
    });
    if (!storedUser || !basicAuth.safeCompare(password, storedUser.password)) {
      cb(null, false);
    } else {
      cb(null, true);
    }
  });
};

const encryptedPasswordAuthorizer = (username, password, cb) => {
  parseCsvWithHeader("./users.csv", (err, users) => {
    const storedUser = users.find((possibleUser) => {
      console.log(possibleUser.username)
      return basicAuth.safeCompare(possibleUser.username, username);
    });
    if (!storedUser) {
      cb(null, false);
    } else {
      bcrypt.compare(password, storedUser.password, cb);
    }
  });
};

app.use(basicAuth({
  authorizer: encryptedPasswordAuthorizer,
  authorizeAsync: true,
  challenge: true,
})
);

const parseCsvWithHeader = (filepath, cb) => {
  const rowSeparator = "\n";
  const cellSeparator = ",";
  fs.readFile(filepath, "utf8", (err, data) => {
    var i = 0
    const rows = data.split(rowSeparator);
    const [headerRow, ...contentRows] = rows.map((row) => row.replace("\r", ""))
    const header = headerRow.split(cellSeparator);
    const items = contentRows.map((row) => {
      const cells = row.split(cellSeparator);
      const item = {
        [header[0]]: cells[0],
        [header[1]]: cells[1],
        ["id"]:i
      };
      i++
      return item;
    });
    return cb(null, items);
  });
};

const getStudentsFromCsvfile = (cb) => {
  parseCsvWithHeader("./list-users.csv", cb);
};

app.get("/api/students", (req, res) => {
  getStudentsFromCsvfile((err, students) => {
    res.send(students);
  });
});

app.get("/api/students", (req,res) => {
  fs.readFile("./list-users.csv", "utf8", (err, d) => {
      res.send(d);
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "./views/home.html"));
});

app.get("/students/create", (req, res) => {
  res.render("create-student");
});

app.get("/students", (req, res) => {
  getStudentsFromCsvfile((err, students) => {
    if (err) {
      console.error(err);
      res.send("ERROR");
    }
    console.log(students)
    res.render("students", {
      students,
    });
  });
});

app.get("/students-no-data", (req, res) => {
  res.render("students-no-data");
});

app.post("/students/create", (req, res) => {
  console.log("begin " + req.body.school);
  const student = req.body;
  console.log("student "+student);
  storeStudentInCsvFile(student, (err, storeResult) => {
    if (err) {
      res.redirect("/students/create?error=1");
    } else {
      res.redirect("/students/create?created=1");
    }
  });
  res.redirect("/students")
});

app.get("/students/:id", (req,res) => {
  const ID_Student = req.params.id
  getStudentsFromCsvfile((err, students) => {
    console.log(students[ID_Student]);
    var student = students[ID_Student]
    res.render("student-details.ejs",{student ,});
  });
});

app.post('/students/:id', (req, res) => {
  const ID_Student = req.params.id;
  console.log(ID_Student)
  console.log(req.body);
  const rowSeparator = "\n";
  const cellSeparator = ",";
  fs.readFile("./list-users.csv", "utf8", (err, data) => {
  const rows = data.split(rowSeparator);
  const [headerRow, ...contentRows] = rows;
  const header = headerRow.split(cellSeparator);
  const students = contentRows.map((row) => {
  const cells = row.split(cellSeparator);
  const student = {
  [header[0]]: cells[0],
  [header[1]]: cells[1],
};
return student;
    });
    const newStudent = {
      [header[0]]: req.body.name,
      [header[1]]: req.body.school,
    }
    students[ID_Student] = newStudent
    fs.writeFile(
      "./list-users.csv",
      headerRow,{ flag: "w" },(err) => {
        if (err) throw err;
      });
    //console.log(students)
    students.forEach(function (students) {
      const csvLine = `\n${students.name},${students.school}`;
      fs.writeFile("./list-users.csv", csvLine,{ flag: "a" }, (err) => {
        if (err) throw err;
      });
    });
    res.redirect("/students");
  });

});

app.get("/students/update/:id", (req, res) => {
  const ID_Student = req.params.id
  getStudentsFromCsvfile((err, students) => {
    var student = students[ID_Student]
    res.render("update-student.ejs",{student ,});
  });
});

const storeStudentInCsvFile = (student, cb) => {
  console.log("Début")
  const list = fs.readFileSync("./list-users.csv", (err) => {
    cb(err, "ok");
  });
  const toparse = list.toString()
  const line = getLines(toparse).lenght;
  console.log(">>"+student)
  const csvLine = `\n${student.name},${student.school},${student.id=line-1}`;
  console.log("fgtv "+csvLine);
  fs.writeFile("./list-users.csv", csvLine, { flag: "a" }, (err) => {});
};

app.post("/api/students/create", (req, res) => {
  console.log(req.body);
  const student = req.body;
  storeStudentInCsvFile(student, (err, storeResult) => {
    if (err) {
      res.status(500).send("error");
    } else {
      res.send("ok");
    }
  });
});

app.post("/students/update", (req,res) => {
  var ID_Student = req.body.id;
  getStudentsFromCsvfile((err, stud) => {
    if (err) {
      console.error(err);
      res.send("ERROR");
    } 
  stud[ID_Student].name = req.body.name;   
  stud[ID_Student].school = req.body.school;   
  stud[ID_Student].id = req.body.id;     
  UpdateStudentInCsvFile(stud, (err, storeResult) => {
    if (err) {
      res.redirect("/students/update?error=1");
    } else {
      res.redirect("/students/update?update=1");
    }
  });

  res.render("stud", {stud,});
  });
});

const SaveStudentInCsvFile = (student, cb) => {
  const file =fs.readFileSync("./list-users.csv",(err) =>{
    cb(err,"ok");
  });
  const toparse = file.toString()
  const lines = getLines(toparse).length;
  const csvLine = `\n${student.name},${student.school},${student.id}`;
  fs.writeFileSync("./list-users.csv", csvLine, { flag: "a" }, (err) => {
  });
};

const Save2StudentInCsvFile = (student, cb) => {
  const list =fs.readFileSync("./list-users.csv",(err) =>{
    cb(err,"ok");
  });
  const toparse = list.toString()
  const csvLine2 = `name,school,id`;
  fs.writeFile("./list-users.csv", csvLine2, { flag: "w" }, (err) => {
  });
  const line = getLines(toparse).length;
  const csvLine = `\n${student.name},${student.school},${student.id}`;
  fs.writeFile("./list-users.csv", csvLine, { flag: "a" }, (err) => {
    
  });
};

const UpdateStudentInCsvFile = (students, cb) => {
  const list =fs.readFileSync("./list-users.csv",(err) =>{
    cb(err,"ok");
  });
  
  for(let i=0; i<students.length; i++){
    if(i==0){
      Save2StudentInCsvFile(students[i], (err, storeResult) => {
        if (err) {
          res.redirect("/students/create?error=1");
        } else {
          res.redirect("/students/create?created=1");
        }
      });
    }
    else{
      SaveStudentInCsvFile(students[i], (err, storeResult) => {
        if (err) {
          res.redirect("/students/create?error=1");
        } else {
          res.redirect("/students/create?created=1");
        }
      });
    } 
    
  } 
};

app.get("/binomialTest", (req, res) => {
  res.render("binomial-test", {binomResult, });
});

app.post("/binomialTest", (req,res) => { 
  var nsuccess = parseInt(req.body.success);
  var ntrials = parseInt(req.body.trials);
  var out = binomialTest(nsuccess,ntrials);
  binomResult = out.pValue+"";
  console.log(binomResult);
  res.render("binomial-test",{ binomResult ,});  
});

app.listen(port, () => {
  console.log(`Example app listening at http://192.168.138.48`);
});

const mongoose = require("mongoose");
const res = require("express/lib/response");
mongoose
  .connect("mongodb://localhost:27017/epfbook", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Succesfully connected to a local Mongo database.");
  })
  .catch((err) => {
    console.error("Could not connect to local Mongo  database! Is it running?");
    console.error("Error:", err);
  });


function getLines(s){ return s.match(/^(.*)$/mg); };

app.get("/students/data", (req, res) => {
  res.render("students-data");
});

app.get("/students/student-details", (req, res) => {
  res.render("student-details");
});


app.post("/students/create-in-db", (req, res) => {
  mongoose
    .model("Student")
    .create(
      { name: req.body.name, school: req.body.school },
      (err, createResult) => {
        if (err) {
          console.error(err);
          throw new Error("Could not create student");
        }
        res.send(createResult);
      }
    );
});
app.get("/students/find-from-db", (req, res) => {
  mongoose.model("Student").find((err, students) => {
    if (err) {
      console.error(err);
      throw new Error("Could not create student");
    }
    res.send(students);
  });
});

app.post("/api/login", (req, res) => {
  console.log("current cookies:", req.cookies);
  const token = "FOOBAR";
  const tokenCookie = {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 60 * 1000),
  };
  res.cookie("auth-token", token, tokenCookie);
  res.send("OK");
});