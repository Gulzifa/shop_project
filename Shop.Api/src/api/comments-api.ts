import { CommentCreatePayload, ICommentEntity } from "../../types";
import { IComment } from "@Shared/types";
import { readFile, writeFile } from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { checkCommentUniq, validateComment } from "../helpers";
import { Request, Response, Router } from "express";
import { connection } from "../..";
import { mapCommentsEntity } from "../services/mapping";
import { OkPacket } from "mysql2";
import { COMMENT_DUPLICATE_QUERY, INSERT_COMMENT_QUERY } from "../services/quries";
import { param, validationResult } from "express-validator"

//функции
const PATH = "/api/comments";

const loadComments = async (): Promise<IComment[]> => {
  const rawData = await readFile("./mock-comments.json", "binary");
  return JSON.parse(rawData.toString());
};

const saveComments = async (data: IComment[]): Promise<void> => {
  await writeFile("mock-comments.json", JSON.stringify(data));
};

export const commentsRouter = Router();


//GET
commentsRouter.get("/", async (req: Request, res: Response) => {
    try {
        const [comments] = await connection.query<ICommentEntity[]>(
            "SELECT * FROM comments"
        );
        
        res.setHeader("Content-Type", "application/json");
        res.send(mapCommentsEntity(comments));
    } catch (e) {
        console.debug(e.message);
        res.status(500);
        res.send("Something went wrong");
    }
});

commentsRouter.get(
    "/:id",
    [ param('id').isUUID().withMessage('Comment id id not UUID')],
    async (req: Request<{ id: string }>, res: Response) => {
    try {
        const erors = validationResult(req);
        if (!erors.isEmpty()) {
            res.status(400);
            res.send(erors.array());
            return
        }
        
        const [rows] = await connection.query<ICommentEntity[]>(
            "SELECT * FROM comments WHERE comment_id = ?",
            [req.params.id]
        );
        
        if (!rows?.[0]) {
            res.status(404)
            res.send(`Comment with id ${req.params.id} is not found`);
            return
        }
                
        res.setHeader("Content-Type", "application/json");
        res.send(mapCommentsEntity(rows)[0]);
    } catch (e) {
        console.debug(e.message);
        res.status(500);
        res.send("Something went wrong");
    }
});


//POST

commentsRouter.post('/', async (
    req: Request<{}, {}, CommentCreatePayload>,
    res: Response
) => {
    const validationResult = validateComment(req.body);

    if (validationResult) {
        res.status(400);
        res.send(validationResult);
        return;
    }

    try {
        const { name, email, body, productId } = req.body;

        const [sameResult] = await connection.query < ICommentEntity[] > (
            COMMENT_DUPLICATE_QUERY,
            [email.toLowerCase(), name.toLowerCase(), body.toLowerCase(), productId]
        );

        if (sameResult.length) {
            res.status(422);
            res.send("Comment with the same fields already exists");
            return;
        }

        const id = uuidv4();
        await connection.query < OkPacket > (
            INSERT_COMMENT_QUERY,
            [id, email, name, body, productId]
        );

        res.status(201);
        res.send(`Comment id:${id} has been added!`);
    } catch (e) {
        console.debug(e.message);
        res.status(500);
        res.send("Server error. Comment has not been created");
    }
});



//PATCH
commentsRouter.patch('/', async (
    req: Request<{}, {}, Partial<IComment>>,
    res: Response
) => {
    try {
        let updateQuery = "UPDATE comments SET ";

        const valuesToUpdate = [];
        ["name", "body", "email"].forEach(fieldName => {
            if (req.body.hasOwnProperty(fieldName)) {
                if (valuesToUpdate.length) {
                    updateQuery += ", ";
                }

                updateQuery += `${fieldName} = ?`;
                valuesToUpdate.push(req.body[fieldName]);
            }
        });

        updateQuery += " WHERE comment_id = ?";
        valuesToUpdate.push(req.body.id);

        const [info] = await connection.query < OkPacket > (updateQuery, valuesToUpdate);

        if (info.affectedRows === 1) {
            res.status(200);
            res.end();
            return;
        }

        const newComment = req.body as CommentCreatePayload;
        const validationResult = validateComment(newComment);

        if (validationResult) {
            res.status(400);
            res.send(validationResult);
            return;
        }

        const id = uuidv4();
        await connection.query < OkPacket > (
            INSERT_COMMENT_QUERY,
            [id, newComment.email, newComment.name, newComment.body, newComment.productId]
        );

        res.status(201);
        res.send({ ...newComment, id })
    } catch (e) {
        console.log(e.message);
        res.status(500);
        res.send("Server error");
    }
});

//DELETE


commentsRouter.delete("/:id", async (req: Request<{ id: string }>, res: Response) => {
      try { 
        const [info] = await connection.query<OkPacket>(
            "DELETE FROM comments WHERE comment_id = ?",
            [req.params.id]
          );
      if (info.affectedRows === 0) {
        res.status(404)
        res.send(`Comment with id ${req.params.id} is not found`);
        return
      }

      res.status(200)
      res.end() 
    } catch (e) {
        console.log(e.message);
        res.status(500);
        res.send("Server error. Comment has not been deleted");
      }

    });


