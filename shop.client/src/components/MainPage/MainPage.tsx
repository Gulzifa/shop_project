import { Link } from "react-router-dom"
import { JSX } from "react"

export function MainPage({ num, sum }: { num: number, sum: number }): JSX.Element {
    return (
        <div>
            <h1 className="title is-2 has-text-danger mt-5">Shop.Client</h1>
            <p className="m-5">В базе данных находится {num} товаров общей стоимостью {sum}</p>
            <button className="button is-link mt-5">
                <Link to="/products-list" className="has-text-white">Перейти к списку товаров</Link>
            </button>
         
        </div>
    )
}
