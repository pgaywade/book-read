import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended : true }));

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "library",
    password: "123456",
    port: 5432,
});
db.connect();

app.get("/api/books", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM books");
    const formattedRows = result.rows.map(row => {
      if (row.figure) {row.figure = row.figure.toString("base64");}
      if (row.dateRead) {row.dateRead = new Date(row.dateRead).toISOString().split("T")[0];}
      return row;
    });
    res.json(formattedRows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

app.get("/", (req, res) => {
    res.render("index.ejs");
});

app.post("/add", async (req, res) => {
  const { isbnNo, title, rating, dateRead, review} = req.body;

  const imgUrl = `https://covers.openlibrary.org/b/isbn/${isbnNo}-M.jpg`; 
    const response = await axios.get(imgUrl, { responseType: "arraybuffer" });
    const imageBuffer = response.data;

  try {
    await db.query(
      "INSERT INTO books (figure, title, rating, dateRead, review) VALUES ($1, $2, $3, $4, $5)",
      [imageBuffer, title, rating, dateRead, review]
    );
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error inserting data");
  }
});

app.post("/edit", async (req, res) => {
  const title = req.body["title"];
  const review = req.body["review"];
  try {
    await db.query("UPDATE books SET review =$1 WHERE title = $2", [review,title]);
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});

app.post("/delete", async (req, res) => {
  const title = req.body["title"];
  try {
    await db.query("DELETE FROM books WHERE title = $1", [title]);
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
  db.end();
});

app.listen(port, () => {
    console.log(`Server running on port ${port}.`);
});