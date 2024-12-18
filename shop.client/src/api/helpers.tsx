import axios from "axios";

import { IProduct } from "../../../Shared/types";


export const API_HOST = 'http://localhost:3000/api'


export const getProducts = async (): Promise<IProduct[]> => {
    try {
        const { data } = await axios.get(`${API_HOST}/products`, {headers: {'Content-Type': 'application/json'}});
        console.log('data in helpers', data)
        return data || [];
    } catch (err) {
        console.log(err.message);
    }
}

export const getProductById = async (id: string): Promise<IProduct> => {
    try {
        const { data } = await axios.get(`${API_HOST}/products/${id}`, {headers: {'Content-Type': 'application/json'}})
        return data;
    } catch (err) {
        console.log(err.message);
    }
}