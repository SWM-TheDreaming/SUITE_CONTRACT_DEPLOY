import createError from "http-errors";
import express from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import logger from "morgan";
import session from "express-session";
import bodyParser from "body-parser";
import nunjucks from "nunjucks";
import dotenv from "dotenv";
import fs from "fs";

import suiteRoomContractCreationConsumer from "./consumers/suiteRoomContractCreationConsumer.js";
import userRegistrationConsumers from "./consumers/userRegistrationConsumer.js";
import stopSuiteConsumer from "./consumers/stopStudyConsumer.js";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.set("view engine", "html");
nunjucks.configure("views", {
  express: app,
  watch: true,
});

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secret: process.env.SECRET,
      httpOnly: true,
    },
  })
);

// for postman
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  req.setTimeout(600000); // 10분 (10 * 60 * 1000 밀리초)
  next();
});

// router atuo attatch
const routeFiles = fs
  .readdirSync(path.join(__dirname, "/routes"))
  .filter((file) => file.indexOf(".") !== 0 && file.slice(-3) === ".js");

for await (const routeFile of routeFiles) {
  const router = await import(`./routes/${routeFile}`);
  app.use(
    `/contract/${routeFile.split(".")[0].replace("index", "")}`,
    router.default
  );
}

const router = await import(`./routes/index.js`);
app.use(`/`, router.default);

// consumer append
userRegistrationConsumers();
suiteRoomContractCreationConsumer();
stopSuiteConsumer();

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  console.log(req);
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render("error", { err });
});

export default app;
