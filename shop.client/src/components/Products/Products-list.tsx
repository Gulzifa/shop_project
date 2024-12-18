import { IProduct } from "../../../../Shared/types";
import { Link } from "react-router-dom";
import "./Products-list.css";

export interface ProductsListProps {
    products: IProduct[]
}


export const ProductsList = ({products}: ProductsListProps) => {
    return (
        <div className="products-list">
            <h1 className="title is-2 has-text-danger m-5">Список продуктов</h1>
            <div className="list grid">
              {
                 products.map((product) => (
                        <div key={product.id} className="card"> 
                      
                        <Link to={`/${product.id}`}>
                            {product.images?.length && product.thumbnail?.url ? (
                                <div className="card-image">
                                    <div className="image is-4by3">
                                        <img src={product.thumbnail?.url} alt={product.title} />
                                    </div>
                                </div>
                            ):
                            <div className="card-image">
                                    <div className="image is-4by3">
                                        <img src="https://via.placeholder.com/150" alt={product.title} />
                                    </div>
                                </div>
                            }
                            <div className="content has-text-white">
                                <h4 className="title is-4 has-text-link	" >{product.title}</h4>
                                <div>
                                    <span className="subtitle is-6">Описание:</span>
                                    {product.description?.length ? product.description : "No description"}
                                </div>
                                <div>
                                    <span className="subtitle is-6">Цена:</span>
                                    {product.price}
                                </div>
                            </div>
                        </Link>                 
                        </div>
                    ))
                }
            </div>
        </div>
    )
}


