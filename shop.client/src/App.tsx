import React, { useEffect, useState } from 'react';
import './App.css';
import {IProduct} from '../../Shared/types'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {MainPage}  from './components/MainPage/MainPage';
import {ProductsList} from './components/Products/Products-list';
import { ProductCard } from './components/ProductItem/ProductCard';
import { getProducts } from './api/helpers';
import Loader from './components/Loader/loader';


function App() {
  const [products, setProducts]: [IProduct[], React.Dispatch<React.SetStateAction<IProduct[]>>] = useState<IProduct[]>([])
  const [loader, setLoader] = useState<boolean>(true)

  useEffect(() => {
    try {
      getProducts()
        .then((data) => {
          setProducts(data)
          setLoader(false)
        })
    } catch (err){
      console.log(err);
      setLoader(false)
    }
  }, []);

 
  const num: number = products.length

  //сумма продуктов
  let sum: number = 0;
  products.forEach((product) => sum += product.price)
  
  return (
    <BrowserRouter>
      <div className="App">
        {loader ? (<Loader />) :
        (<Routes>
          <Route path="/" element = {<MainPage num = {num} sum = {sum} />} />
          <Route path="/products-list" element = {<ProductsList products={products}/> }/>
          {products.map((product) => (
            <Route key={product.id} path={`/${product.id}`} element = {<ProductCard productId={product.id} key={product.id} />} />
          ))}          
        </Routes>)}
      </div>
    </BrowserRouter>
  );
}

export default App;
