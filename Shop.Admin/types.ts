import { IProduct } from "@Shared/types";

declare module 'express-session' {
    export interface SessionData {
      username?: string;
    }
  }


export interface IProductEditData {
    title: string;
    description: string;
    price: string;
    mainImage: string;
    newImages?: string;
    commentsToRemove: string | string[];
    imagesToRemove: string | string[];
    matchesToRemove: string | string[];
    productsToMatch: string | string[];
}

export type ProductCreatingPayload = Omit<IProduct, "id" | "comments" | "thumbnail" | "images"> 

