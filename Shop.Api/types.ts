import { RowDataPacket } from "mysql2";
import { IComment, IProduct, IProductImage, IProductFilterPayload, IAuthRequisites } from "@Shared/types";

export type CommentCreatePayload = Omit<IComment, "id">;

export interface ICommentEntity extends RowDataPacket {
    comment_id: string;
    name: string;
    email: string;
    body: string;
    product_id: string;
}


//PRODUCT types
export interface IProductEntity extends IProduct, RowDataPacket {
    product_id: string;
}

export interface IProductSearchFilter extends IProductFilterPayload {}

export type ProductCreatePayload = Omit<IProduct, "id" | "comments" | "thumbnail" | "images"> & { images: ImageCreatePayload[]};



//IMAGE types
export type ImageCreatePayload = Omit<IProductImage, "id" | "productId">;

export interface IProductImageEntity extends RowDataPacket {
    image_id: string;
    product_id: string;
    main: boolean;
    url: string;
}

export interface ProductAddImagesPayload {
    productId: string;
    images: ImageCreatePayload[];
}

export type ImageToRemovePayload = string[];

//MATCHES types

export interface IMatchEntity extends RowDataPacket {
    product_id: string;
    matched_product_id: string
}

export interface IMatchesToRemove {
    productId: string;
    matchesToRemove: string[];
}

export interface IProductsToMatch {
    productId: string;
    productsToMatch: string[];
}

export interface IUserRequisitesEntity extends IAuthRequisites, RowDataPacket {
    id: number;
    
}



