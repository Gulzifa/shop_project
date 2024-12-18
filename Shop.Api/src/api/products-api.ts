import { Request, Response, Router } from "express";
import { connection } from "../..";
import {
  IProductEntity,
  ICommentEntity,
  ProductCreatePayload,
  IProductSearchFilter,
  IProductImageEntity,
  ProductAddImagesPayload,
  ImageToRemovePayload,
  IMatchesToRemove,
  IProductsToMatch,
} from "../../types";
import { mapImagesEntity, mapProductsEntity, mapProductEntity } from "../services/mapping";
import { enhanceProductsComments, enhanceProductsImages } from "../helpers";
import { mapCommentsEntity } from "../services/mapping";
import { getProductsFilterQuery } from "../helpers";
import { v4 as uuidv4 } from "uuid";
import {
  INSERT_PRODUCT_QUERY,
  INSERT_PRODUCT_IMAGES_QUERY,
  DELETE_IMAGES_QUERY,
  REPLACE_PRODUCT_THUMBNAIL,
  UPDATE_PRODUCT_FIELDS,
  INSERT_MATCHES_QUERY,
  DELETE_MATCHES_QUERY,
} from "../services/quries";
import { OkPacket } from "mysql2";
import { param, body, validationResult } from "express-validator";

export const productsRouter = Router();

//хелпер в случае неудачи

const throwServerError = (res: Response, e: Error) => {
  console.debug(e.message);
  res.status(500);
  res.send("Something went wrong");
};


//метод получения списка товаров вместе с изображениями
productsRouter.get("/", async (req: Request, res: Response) => {

  try {
    const [productRows] = await connection.query<IProductEntity[]>(
      "SELECT * FROM products"
    );
    const [commentRows] = await connection.query<ICommentEntity[]>(
      "SELECT * FROM comments"
    );
    const [imageRows] = await connection.query<IProductImageEntity[]>(
      "SELECT * FROM images"
    );

    const [matches] = await  connection.query<IProductEntity[]>(
      "SELECT * FROM matches"
    )


    const products = mapProductsEntity(productRows);
    const withComments = enhanceProductsComments(products, commentRows);
    const withImages = enhanceProductsImages(withComments, imageRows);

    res.send(withImages);
  } catch (e) {
    throwServerError(res, e);
  }
});

//метод поиска товаров вместе с изображениями
productsRouter.get(
  "/search",
  async (req: Request<{}, {}, {}, IProductSearchFilter>, res: Response) => {
    try {
      const [query, values] = getProductsFilterQuery(req.query);
      const [rows] = await connection.query<IProductEntity[]>(query, values);

      if (!rows?.length) {
        res.send([]);
        return;
      }

      const [commentRows] = await connection.query<ICommentEntity[]>(
        "SELECT * FROM comments"
      );
      const [imageRows] = await connection.query<IProductImageEntity[]>(
        "SELECT * FROM images"
      );

      const products = mapProductsEntity(rows);
      const withComments = enhanceProductsComments(products, commentRows);
      const withImages = enhanceProductsImages(withComments, imageRows);

      res.send(withImages);
    } catch (e) {
      throwServerError(res, e);
    }
  }
);

productsRouter.get(
  "/:id",
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const [rows] = await connection.query<IProductEntity[]>(
        "SELECT * FROM products WHERE product_id = ?",
        [req.params.id]
      );

      if (!rows?.[0]) {
        res.status(404);
        res.send(`Product with id ${req.params.id} is not found`);
        return;
      }

      const [comments] = await connection.query<ICommentEntity[]>(
        "SELECT * FROM comments WHERE product_id = ?",
        [req.params.id]
      );
      const [images] = await connection.query<IProductImageEntity[]>(
        "SELECT * FROM images WHERE product_id = ?",
        [req.params.id]
      );

      //1.получение списка «похожих товаров» для конкретного товара!!!!!!!!!!!!!!!!!!!!!!!!
      const [matches] = await connection.query<IProductEntity[]>(
        `SELECT p.product_id, p.title, p.description, p.price 
        FROM matches m 
        JOIN products p ON (m.matched_product_id = p.product_id OR m.product_id = p.product_id) 
        WHERE (m.product_id = ? OR m.matched_product_id = ?) 
        AND p.product_id != ?`,
        [req.params.id, req.params.id, req.params.id]
      );

      const [productsToMatch] = await connection.query<IProductEntity[]>(
        `SELECT p.product_id, p.title, p.price FROM products p
        WHERE product_id != ? AND product_id NOT IN (
        SELECT matched_product_id
        FROM matches
        WHERE product_id = ?);`,
        [req.params.id, req.params.id]
      );

      const product = mapProductsEntity(rows)[0];

      if (comments.length) {
        product.comments = mapCommentsEntity(comments);
      }

      if (images.length) {
        product.images = mapImagesEntity(images);
        product.thumbnail =
          product.images.find((image) => image.main) || product.images[0];
      }

      if (matches) {
        product.matches = mapProductsEntity(matches);
      }

      if (productsToMatch) {
        product.productsToMatch = mapProductsEntity(productsToMatch);
      }

      res.send(product);
    } catch (e) {
      throwServerError(res, e);
    }
  }
);


// ADD PRODUCT with image
productsRouter.post(
  "/new-product",
  async (req: Request<{}, {}, ProductCreatePayload>, res: Response) => {
    try {
      console.log('Request to /new-product in products-api', req.body);
      const { title, description, price, images } = req.body;
      const productId = uuidv4();
      await connection.query<OkPacket>(INSERT_PRODUCT_QUERY, [
        productId,
        title || null,
        description || null,
        price || null,
      ]);

      if (images) {
        const values = images.map((image) => [
          uuidv4(),
          image.url,
          productId,
          image.main,
        ]);
        await connection.query<OkPacket>(INSERT_PRODUCT_IMAGES_QUERY, [values]);
      }
      const [newProductRow] = await connection.query<OkPacket>(
        "SELECT * FROM products WHERE product_id = ?",
        [productId]
      )

      const newProduct = mapProductEntity(newProductRow[0]);
     

      res.status(201);
      res.send(newProduct);
    } catch (e) {
      throwServerError(res, e);
    }
  }
);

//метод удаления товара с предварительным удалением всех изображений и комментариев, которые относятся к этому товару

productsRouter.delete(
  "/:id",
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      await connection.query<OkPacket>(
        "DELETE FROM matches WHERE product_id = ? OR matched_product_id = ?",
        [req.params.id, req.params.id]
      );

      const [rows] = await connection.query<OkPacket>(
        "DELETE FROM products WHERE product_id = ?",
        [req.params.id]
      );

      if (rows?.affectedRows === 0) {
        res.status(404);
        res.send(`Product with id ${req.params.id} is not found`);
        return;
      }

      await connection.query<OkPacket>(
        "DELETE FROM images WHERE product_id = ?",
        [req.params.id]
      );
      await connection.query<OkPacket>(
        "DELETE FROM comments WHERE product_id = ?",
        [req.params.id]
      );
      await connection.query<OkPacket>(
        "DELETE FROM products WHERE product_id = ?",
        [req.params.id]
      );

      res.status(200);
      res.end();
    } catch (e) {
      throwServerError(res, e);
    }
  }
);

//добавление изображений конкретному товару

productsRouter.post(
  "/new-images",
  async (req: Request<{}, {}, ProductAddImagesPayload>, res: Response) => {
    try {
      const { productId, images } = req.body;

      if (!images?.length) {
        res.status(400);
        res.send("Images array is empty");
        return;
      }

      const values = images.map((image) => [
        uuidv4(),
        image.url,
        productId,
        image.main,
      ]);
      await connection.query<OkPacket>(INSERT_PRODUCT_IMAGES_QUERY, [values]);

      res.status(200);
      res.send(`Images for a product id:${productId} have been added!`);
    } catch (e) {
      throwServerError(res, e);
    }
  }
);

//удаление списка изображений из таблицы images

productsRouter.post(
  "/remove-images",
  async (req: Request<{}, {}, ImageToRemovePayload>, res: Response) => {
    try {
      const imagesToRemove = req.body;

      if (!imagesToRemove?.length) {
        res.status(400);
        res.send("Images array is empty");
        return;
      }

      const [info] = await connection.query<OkPacket>(DELETE_IMAGES_QUERY, [
        [imagesToRemove],
      ]);

      if (info.affectedRows === 0) {
        res.status(404);
        res.send("No one image has been removed");
        return;
      }

      res.status(200);
      res.send(`Images have been removed!`);
    } catch (e) {
      throwServerError(res, e);
    }
  }
);

//2.MATCHING products /products/matching-products

productsRouter.post(
  "/matching-products", 
  [
    body('productId').notEmpty().withMessage('Products to match is required'),
    body('productsToMatch').notEmpty().withMessage('Products to match is required'),
  ],
  async (req: Request<{}, {}, IProductsToMatch>, res: Response) => {
    try {
      const { productId, productsToMatch } = req.body;
      console.log("post in MATCHING", { productId, productsToMatch });
      if (!productsToMatch?.length) {
        res.status(400);
        res.send("Matches array is empty");
        return;
      }
      //несколько запросов
      let totalAffectedRows = 0;
      for (const matchingProduct of productsToMatch) {
        const [matchingInfo] = await connection.query<OkPacket>(
          INSERT_MATCHES_QUERY,
          [productId, matchingProduct]
        );
        totalAffectedRows += matchingInfo.affectedRows;
        console.log("totalAffectedRows", totalAffectedRows);
      }

      
      
      if (totalAffectedRows === 0) {
        res.status(404);
        res.send("No one product has been matched");
        return;
      }

      res.status(200);
      res.send(`Matches have been removed!`);
    } catch (e) {
      throwServerError(res, e);
    }
  }
);

//3.MATCHES для удаления 

productsRouter.post(
  "/remove-matches",
  [
    body('productId').notEmpty().withMessage('Products to match is required'),
    body('matchesToRemove').notEmpty().withMessage('Matches to remove is required'),
  ],
  async (req: Request<{}, {}, IMatchesToRemove>, res: Response) => {
    try {
      const { productId, matchesToRemove } = req.body;

      if (!matchesToRemove?.length) {
        res.status(400);
        res.send("Matches array is empty");
        return;
      }
      //
      const [deletedMatchesInfo] = await connection.query<OkPacket>(
        DELETE_MATCHES_QUERY,
        [productId, matchesToRemove, productId, matchesToRemove]
      );

      console.log("post in remove matches");

      if (deletedMatchesInfo.affectedRows === 0) {
        res.status(404);
        res.send("No one match has been removed");
        return;
      }

      res.status(200);
      res.send(`Matches have been removed!`);
    } catch (e) {
      throwServerError(res, e);
    }
  }
);

//изменение обложки товара

productsRouter.post(
  "/update-thumbnail/:id",
  [
    param("id").isUUID().withMessage("Product id is not UUID"),
    body("newThumbnailId").isUUID().withMessage("New thumbnail id is not UUID"),
  ],
  async (
    req: Request<{ id: string }, {}, { newThumbnailId: string }>,
    res: Response
  ) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400);
        res.send(errors.array());
        return;
      }
      //проверяем наличие у данного товара обложки
      const [currentThumbnailRows] = await connection.query<
        IProductImageEntity[]
      >("SELECT * FROM images WHERE product_id=? AND main =?", [
        req.params.id,
        1,
      ]);

      if (!currentThumbnailRows?.length || currentThumbnailRows.length > 1) {
        res.status(400);
        res.send("Incorrect product Id");
        return;
      }

      // проверяем наличие новой обложки в базе
      const [newThumbnailRows] = await connection.query<IProductEntity[]>(
        "SELECT * FROM images WHERE product_id=? AND image_id=?",
        [req.params.id, req.body.newThumbnailId]
      );

      if (newThumbnailRows?.length !== 1) {
        res.status(400);
        res.send("Incorrect new thumbnail id");
        return;
      }
      const currentThumbnailId = currentThumbnailRows[0].image_id;
      const [info] = await connection.query<OkPacket>(
        REPLACE_PRODUCT_THUMBNAIL,
        [
          currentThumbnailId,
          req.body.newThumbnailId,
          currentThumbnailId,
          req.body.newThumbnailId,
        ]
      );

      if (info.affectedRows === 0) {
        res.status(404);
        res.send("No one image has been updated");
        return;
      }
    } catch (e) {
      throwServerError(res, e);
    }
  }
);

//UPDATE: обновление данных товара – заголовка, описания и стоимости

productsRouter.patch(
  "/:id",
  async (
    req: Request<{ id: string }, {}, ProductCreatePayload>,
    res: Response
  ) => {
    try {
      const { id } = req.params;

      const [rows] = await connection.query<IProductEntity[]>(
        "SELECT * FROM products WHERE product_id = ?",
        [id]
      );

      if (!rows?.[0]) {
        res.status(404);
        res.send(`Product with id ${id} is not found`);
        return;
      }

      const currentProduct = rows[0];

      await connection.query<OkPacket>(UPDATE_PRODUCT_FIELDS, [
        req.body.hasOwnProperty("title")
          ? req.body.title
          : currentProduct.title,
        req.body.hasOwnProperty("description")
          ? req.body.description
          : currentProduct.description,
        req.body.hasOwnProperty("price")
          ? req.body.price
          : currentProduct.price,
        id,
      ]);

      res.status(200);
      res.send('updated');
    } catch (e) {
      throwServerError(res, e);
    }
  }
);
