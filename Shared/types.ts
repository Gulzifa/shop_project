export interface IComment {
    id?: string;
    name: string;
    email: string;
    body: string;
    productId: string;
} 



//PRODUCT types
export interface IProduct {
    id: string;
    title: string;
    description: string;
    price: number;
    comments?: IComment[];
    thumbnail?: IProductImage;
    images?: IProductImage[];
    matches?: IProduct[];
    productsToMatch?: IProduct[];
}


//IMAGE types
export interface IProductImage {
    id: string;
    productId: string;
    main: boolean;
    url: string;
}

export interface IProductFilterPayload {
    title?: string;
    description?: string;
    priceFrom?: number;
    priceTo?: number;
}

// export interface IMatch {
//     productId: string;
//     matchedId: string;
// }

export interface IAuthRequisites {
    username: string;
    password: string;
}

