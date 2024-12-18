import axios from "axios";
import {
  IProduct,
  IProductFilterPayload,
  IAuthRequisites,
} from "@Shared/types";
import { IProductEditData, ProductCreatingPayload } from "../types";
import { API_HOST } from "./const";

//ADD PRODUCT
export async function addProduct(
  product: ProductCreatingPayload
): Promise<IProduct> {
  console.log('adding throw model', product)
  const response = await axios.post(`${API_HOST}/products/new-product`, product);
  return response.data
}



export async function getProducts(): Promise<IProduct[]> {
  const { data } = await axios.get<IProduct[]>(`${API_HOST}/products`);
  return data || [];
}

export async function searchProducts(
  filter: IProductFilterPayload
): Promise<IProduct[]> {
  const { data } = await axios.get<IProduct[]>(`${API_HOST}/products/search`, {
    params: filter,
  });
  return data || [];
}

export async function getProduct(id: string): Promise<IProduct | null> {
  try {
    const { data } = await axios.get<IProduct>(`${API_HOST}/products/${id}`);
    return data;
  } catch (e) {
    return null;
  }
}

export async function removeProduct(id: string): Promise<void> {
  await axios.delete(`${API_HOST}/products/${id}`);
}



//helpers

function compileIdsToRemove(data: string | string[]): string[] {
  if (typeof data === "string") return [data];
  return data;
}

function splitNewImages(str = ""): string[] {
  return str
    .split(/\r\n|,/g)
    .map((url) => url.trim())
    .filter((url) => url);
}

export async function updateProduct(
  productId: string,
  formData: IProductEditData
): Promise<void> {
  try {
    // запрашиваем у Products API товар до всех изменений
    const { data: currentProduct } = await axios.get<IProduct>(
      `${API_HOST}/products/${productId}`
    );

    if (formData.commentsToRemove) {
      //Comments API "delete" метод
      const commentsIdsToRemove = compileIdsToRemove(formData.commentsToRemove);
      const getDeleteCommentActions = () =>
        commentsIdsToRemove.map((commentId) => {
          return axios.delete(`${API_HOST}/comments/${commentId}`);
        });
      await Promise.all(getDeleteCommentActions());
    }

    if (formData.imagesToRemove) {
      //Products API "remove-images" метод
      const imagesIdsToRemove = compileIdsToRemove(formData.imagesToRemove);
      await axios.post(`${API_HOST}/products/remove-images`, imagesIdsToRemove);
    }

    if (formData.newImages) {
      //newImages в массив строк
      const urls = splitNewImages(formData.newImages);
      const images = urls.map((url) => ({ url, main: false }));
      if (!currentProduct.thumbnail) {
        images[0].main = true;
      }
      //добавление изображений  Products API "add-images" метод
      await axios.post(`${API_HOST}/products/add-images`, {
        productId,
        images,
      });
    }

    if (
      formData.mainImage &&
      formData.mainImage !== currentProduct?.thumbnail?.id
    ) {
      
      // если при редактировании товара было выбрано другое изображение для обложки,
      // то нужно обратиться к Products API "update-thumbnail" методу
      await axios.post(`${API_HOST}/products/update-thumbnail/${productId}`, {
        newThumbnailId: formData.mainImage,
      });
    }

    //2.Получение списка оставшихся товаров кроме matched и product_id
    if (formData.productsToMatch) {
      const productsToMatch = compileIdsToRemove(formData.productsToMatch);
      await axios.post(`${API_HOST}/products/matching-products`, {
        productId: productId,
        productsToMatch: productsToMatch
      });
    }
   
    //3.MATCHES для удаления
    if (formData.matchesToRemove) {
      const matchesToRemove = compileIdsToRemove(formData.matchesToRemove);
      await axios.post(`${API_HOST}/products/remove-matches`, {
        productId: productId,
        matchesToRemove: matchesToRemove
      });
    }

    // обращаемся к Products API методу PATCH для обновления всех полей, которые есть в форме
    // в ответ получаем обновленный товар и возвращаем его из этой функции

    await axios.patch(`${API_HOST}/products/${productId}`, {
      title: formData.title,
      description: formData.description,
      price: Number(formData.price),
      mainImage: formData.mainImage,
      newImages: formData.newImages,
      commentsToRemove: formData.commentsToRemove,
      imagesToRemove: formData.imagesToRemove,
      matchesToRemove: formData.matchesToRemove
    });
  } catch (e) {
    console.log(e);
  }
}
