    export const  COMMENT_DUPLICATE_QUERY = `
        SELECT * FROM comments c
        WHERE LOWER(c.email) = ?
        AND LOWER(c.name) = ?
        AND LOWER(c.body) = ?
        AND c.product_id = ?
    `;

    export const INSERT_COMMENT_QUERY = `
        INSERT INTO comments
        (comment_id, email, name, body, product_id)
        VALUES
        (?, ?, ?, ?, ?)
   `;

    export const INSERT_PRODUCT_QUERY  = `
        INSERT INTO products
        (product_id, title, description, price)
        VALUES
        (?, ?, ?, ?)
        `;

    export const INSERT_PRODUCT_IMAGES_QUERY = `
        INSERT INTO images
        (image_id, url, product_id, main)
        VALUES ?
      `;
      
    export const DELETE_IMAGES_QUERY = `
        DELETE FROM images 
        WHERE image_id IN ?;
      `;

    export const REPLACE_PRODUCT_THUMBNAIL = `
        UPDATE images
        SET main = CASE
            WHEN image_id = ? THEN 0
            WHEN image_id = ? THEN 1
        ELSE main
        END
        WHERE image_id IN (?, ?);
        `;

    export const UPDATE_PRODUCT_FIELDS = `
    UPDATE products 
    SET title = ?, description = ?, price = ? 
    WHERE product_id = ?
    `;

    export const INSERT_MATCHES_QUERY = `
        INSERT INTO matches
        (product_id, matched_product_id)
        VALUES (?, ?)
    `;

    export const DELETE_MATCHES_QUERY = `
        DELETE FROM matches
        WHERE (product_id = ? AND matched_product_id IN (?))
        OR (matched_product_id = ? AND product_id IN (?));
      `;
