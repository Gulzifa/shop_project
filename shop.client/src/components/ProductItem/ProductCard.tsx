import React, { useEffect, useState } from "react";
import { IProduct } from "../../../../Shared/types";
import { Link } from "react-router-dom";
import { getProductById } from "../../api/helpers";
import "./ProductCard.css"

export interface ProductCardProps {
    productId: string
}

export const ProductCard = ({productId}) => {
    const [product, setProduct] = useState<IProduct | null>(null)
    useEffect(() => {
        getProductById(productId)
        .then((data) => { setProduct(data) })
    }, [ productId ]) 
        
    return (
        <div className="product-card">
            <div className="product">
                {product && ( <div>
                    <h1 className="title is-2 has-text-danger m-5">{product.title}</h1>
                    {product.thumbnail?.url ? ( 
                        <div className="card-image image-wrap">
                            <div className="image is-4by3">
                                <img src={product.thumbnail?.url} alt={product.title} className="product-image"/>
                            </div>
                        </div> ):(
                            <div className="card-image image-wrap">
                            <figure className="image is-128x128">
                                <img src="https://bulma.io/assets/images/placeholders/256x256.png" alt={product.title} />
                            </figure>
                        </div>
                        )}
        
                        {product.images?.length ?
                            (<div className="grid 0.75rem mt-5">
                                {product.images.map((image) => (
                                    <div key={image.id} className="product-image">
                                        <div className="image is-128x128">
                                            <img src={image.url} alt={image.url} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ): (<div className="card-image mt-5">
                                <figure className="image is-128x128">
                                    <img src="https://bulma.io/assets/images/placeholders/256x256.png" alt={product.title} />
                                </figure>
                            </div>)}
                    
                        {product.description && (
                            <div className="content is-normal">
                                <h3 className="title is-3 mb-4">Описание:</h3>
                                <p>{product.description}</p>
                            </div>
                        )}

                        {product.matches?.length > 0 && (
                            <div className="is-flex-direction-row is-gap-1">
                                <div>
                                    <h3 className="title is-4 mb-4">Список похожих товаров:</h3>
                                        {product.matches.map((match) => (
                                            <Link to={`/${match.id}`}>                                   
                                                    <ul className="card mb-4 match-card">
                                                        <li>
                                                            <p className="card-header-title">{match.title}</p>
                                                            <p className="content p-2">{match.price} руб.</p>
                                                        </li>
                                                    </ul>                                
                                            </Link>
                                        ))}
                                </div>
                            </div>
                        )}
        

                        { product.comments?.length && (
                            <div>
                                <h1 className="title is-4 mb-4">Комментарии</h1>
                                    {product.comments.map((comment) => (
                                        <div className="message is-dark comment">
                                            <div className="message-header">
                                                <p>{comment.email}</p> 
                                            </div>
                                            <div className="message-body">
                                                <h6 className="title is-6 mb-2">{comment.name}</h6>
                                                <span>{comment.body}</span>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                </div>)}
            </div>
        </div>
    )

}