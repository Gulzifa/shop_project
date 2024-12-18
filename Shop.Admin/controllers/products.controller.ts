import { Router, Request, Response } from "express";
import { getProducts, searchProducts, getProduct, removeProduct, updateProduct } from "../models/products.model";
import { IProductFilterPayload } from "@Shared/types";
import { IProductEditData, ProductCreatingPayload} from "../types";
import { throwServerError } from "./helpers";
import { addProduct } from "../models/products.model";


export const productsRouter = Router();

//ADD NEW PRODUCT
productsRouter.get("/new-product", async (
    req: Request<{}, {}, ProductCreatingPayload >,
    res: Response
) => {
    try {
        
        console.log('control in product')
        res.render("product/new-product" );

    } catch (e) {
        throwServerError(res, e)
    }
})

productsRouter.post("/new-product", async (
    req: Request<{}, {}, ProductCreatingPayload>,
    res: Response
) => {
    try {
        console.log('req.body in control', req.body)
        const { title, description, price } = req.body;
        const newProduct = await addProduct({ title, description, price});
        
        res.redirect(`/admin/${newProduct.id}`);
    } catch (e) {
        throwServerError(res, e)
    }
})

productsRouter.get('/', async (req: Request, res: Response) => {
    try {
        console.log("req.session",req.session.username);
        const products = await getProducts();
        res.render("products", { 
            items: products, 
            queryParams: {},
        });
    } catch (e) {
        throwServerError(res, e);
    }
});


productsRouter.get('/search', async (req: Request<{}, {}, IProductFilterPayload>, res: Response) => {
    try {
        const products = await searchProducts(req.query);
        res.render('products', {
            items: products,
            queryParams: req.query
        })
    } catch(e) {
        throwServerError(res, e)
    }
})

productsRouter.get('/:id', async (
    req: Request<{ id: string }>,
    res: Response
) => {
    try {
        const product = await getProduct(req.params.id);

        if (product) {
            res.render("product/product", {
                item: product
            });
        } else {
            res.render("product/empty-product", {
                id: req.params.id
            });
        }
    } catch (e) {
        throwServerError(res, e);
    }
});

productsRouter.get('/remove-product/:id', async (
    req: Request<{ id: string }>,
    res: Response
) => {
    try {
        if (req.session.username !== "admin") {
            res.status(403)
            res.send("Forbidden");
            return
        }
        await removeProduct(req.params.id);
        res.redirect(`/${process.env.ADMIN_PATH}`);
    } catch (e) {
        throwServerError(res, e);
    }
});

productsRouter.post('/save/:id', async (
    req: Request<{ id: string }, {}, IProductEditData >,
    res: Response
) => {
    try {
        const updatedProduct = await updateProduct(req.params.id, req.body);
        //РЕДИРЕКТ
        res.redirect(`/admin/${req.params.id}`);
    } catch (e) {
        throwServerError(res, e);
    }
});




