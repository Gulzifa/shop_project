require('dotenv').config();
import express, { Express } from "express";
import { Connection } from "mysql2/promise";
import { initDatabase } from "./Server/services/db";
import { initServer } from "./Server/services/server";
import ShopApi from "./Shop.Api";
import ShopAdmin from "./Shop.Admin";
import path from "path";
import { createProxyMiddleware } from "http-proxy-middleware";


export let server: Express;
export let connection: Connection | null;



async function launchApplication() {
    server = initServer();
    connection = await initDatabase();
    initRouter()

}

function initRouter() {
    server.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', 'http://localhost:3001');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        next();
      });

    const shopApi = ShopApi(connection);
    server.use("/api", shopApi);

    
    const shopAdmin = ShopAdmin();
    server.use("/admin", shopAdmin);
    
    // server.get("/admin", (_, res) => {
    //     res.sendFile(path.join(__dirname, 'shop.admin', 'index.html'));
    // });

    // Отдаём статику из папки `Shop.Client/build`
    server.use(express.static(path.join(__dirname, 'shop.client', 'build')));
     // Прокси-сервер для запросов на сервер клиента
    server.use('/', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));

    // Все остальные запросы перенаправляем на index.html, чтобы React мог управлять маршрутизацией
    server.use("/", (_, res) => {
        res.sendFile(path.join(__dirname, 'shop.client', 'build', 'index.html'));
    });


}



launchApplication();