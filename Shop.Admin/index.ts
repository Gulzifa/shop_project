import express, { Express } from "express";
import { productsRouter } from "./controllers/products.controller";
import { authRouter, validateSession } from "./controllers/auth.controller";
import layouts from "express-ejs-layouts";
import bodyParser from "body-parser";
import session from "express-session";

export default function (): Express {
    const app = express();
  
    app.use(session({
      secret: process.env.SESSION_SECRET,
      saveUninitialized: false,
      resave: false
    }));

    //Для того, чтобы обрабатывать данные формы x-www-form-urlencoded  
    app.use(express.json());
    app.use(bodyParser.urlencoded({ extended: false }));
  
    app.set("view engine", "ejs");
    app.set("views", "Shop.Admin/views");
    app.use((req, res, next) => {
      const isAdmin = req.session.username === "admin";
      res.locals.isAdmin = isAdmin
      next()
    })
    app.use(layouts);
  
    app.use(express.static(__dirname + "/public"));
  
    app.use(validateSession);
  
    app.use("/auth", authRouter);
    app.use("/", productsRouter);
 
  
    return app;
  }
