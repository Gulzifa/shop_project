import { ICommentEntity, IMatchEntity, IProductEntity, IProductImageEntity} from "../../types";
import { IComment, IProduct, IProductImage } from "@Shared/types";

export const mapCommentEntity = ({comment_id, product_id, ...rest}: ICommentEntity): IComment => {
    return {
        id: comment_id,
        productId: product_id,
        ...rest
    }
}

export const mapCommentsEntity = (data: ICommentEntity[]): IComment[] => {
    return data.map(mapCommentEntity);
}

export const mapProductEntity = ({product_id, title, description, price}): IProduct => {
    return {
        id: product_id,
        title: title,
        description: description,
        price: price
    }
}

export const mapProductsEntity = (data: IProductEntity[]): IProduct[] => {
    return data.map(({ product_id, title, description, price }) => ({
        id: product_id,
        title: title || "",
        description: description || "",
        price: Number(price) || 0
    }))
}

export const mapImageEntity = ({ image_id, product_id, url, main }: IProductImageEntity): IProductImage => {
    return {
        id: image_id,
        productId: product_id,
        main: Boolean(main),
        url
    }
}

export const mapImagesEntity = (data: IProductImageEntity[]): IProductImage[] => {
    return data.map(mapImageEntity)
}

// export const mapMatchEntity = ({product_id, matched_product_id}: IMatchEntity): IMatch => {
//     return {
//        productId: product_id,
//        matchedId: matched_product_id
//     }
// }

// export const mapMatchesEntity = (data: IMatchEntity[]): IMatch[] => {
//     return data.map(mapMatchEntity)
// }