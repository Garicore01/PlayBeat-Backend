/**
 * @swagger
 * tags:
 *   name: Listas
 *   description: Operaciones relacionadas con las listas de audios
 */
/**
 * @swagger
 * components:
 *  schemas:
 *      Lista:
 *          type: object
 *          required:
 *             - nombre
 *             - esAlbum
 *             - esPrivada
 *             - tipoLista
 *             - idUsuario
 *          properties:
 *              idLista:
 *                  type: number
 *                  description: Identificador de la lista
 *              nombre:
 *                  type: string
 *                  description: Nombre de la lista
 *              esAlbum:
 *                  type: boolean
 *                  description: Indica si la lista es un album
 *              esPrivada:
 *                  type: boolean
 *                  description: Indica si la lista es privada
 *              descripcion:
 *                  type: string
 *                  description: Descripción de la lista
 *              imgLista:
 *                  type: string
 *                  description: uri de la imagen de la lista
 *              tipoLista:
 *                  type: string
 *                  description: Tipo de lista
 *                  enum: ["MIS_AUDIOS", "MIS_FAVORITOS", "MIS_PODCAST", "NORMAL"]
 *              idUsuario:
 *                  type: number
 *                  description: Id del usuario creador de de la lista, será el primer propietario.
 *              fechaUltimaMod:
 *                  type: string
 *                  description: Fecha de última modificación de la lista
 *          example:
 *              idLista: 1
 *              nombre: "Lista de ejemplo"
 *              esAlbum: false
 *              esPrivada: false
 *              descripcion: "Descripción de la lista"
 *              imgLista: "adsfas-asdfaijlk-a"
 *              tipoLista: "NORMAL"
 *              idUsuario: 1
 *              fechaUltimaMod: "2021-06-01T12:00:00Z"
 *      TipoLista:
 *          type: string
 *          enum: ["MIS_AUDIOS", "MIS_FAVORITOS", "MIS_PODCAST", "NORMAL"]
 *          description: Tipo de lista, "MIS_AUDIOS", "MIS_FAVORITOS", "MIS_PODCAST" están reservados para las listas creadas por defecto para un usuario al crear su cuenta.
 * 
 * 
 */
import express, { Express, Request, Response } from "express";
export const listaRouter = express.Router();
import * as auth from "../middleware/authenticator.js";

import * as listaController from "../controllers/listaController.js";


// CUALQUIER PETICIÓN DE CONSULTA DE INFORMACIÓN DEVOLVERÁ EL RESULTADO SOBRE LA INFORMACIÓN
// A LA QUE EL USUARIO TENGA ACCESO, ES DECIR, SI EL USUARIO NO ES PROPIETARIO O ADMIN SOLO 
// PODRÁ ACCEDER A LA INFORMACIÓN PÚBLICA


//[POST]/lista/ : Crea una lista nueva.
/**
 * @swagger
 * /lista/:
 *   post:
 *     tags: [Listas]
 *     summary: Crea una lista nueva.
 *     description: Crea una lista nueva.
 *     requestBody:
 *       content:
 *          application/json:
 *             schema:
 *                type: object
 *                properties:
 *                   nombre:
 *                      type: string
 *                   esAlbum:
 *                      type: boolean
 *                   esPrivada:
 *                      type: boolean
 *                   descripcion:
 *                      type: string
 *                   imgLista:
 *                      type: string
 *                   tipoLista:
 *                      $ref: '#/components/schemas/TipoLista'
 *                   idUsuario:
 *                      type: number
 *                   audios:
 *                      type: array
 *                      items:
 *                         type: number
 *   
 *   
 *     security:
 *        - bearerAuth: []
 *     responses:
 *        200:
 *           description: Lista creada correctamente.
 *           content:
 *              application/json:
 *                 schema:
 *                    $ref: '#/components/schemas/Lista'
 *        400:
 *           description: Error en la petición.
 * 
 */
listaRouter.post("/", auth.authenticate, listaController.createLista);

//[DELETE]/lista/<idLista>/ : Borra una lista.
/**
 * @swagger
 * /lista/{idLista}:
 *   delete:
 *     tags: [Listas]
 *     summary: Borra una lista.
 *     description: Borra una lista si el usuario es propietario o administrador.
 *   parameters:
 *     - in: path
 *       name: idLista
 *       required: true
 *       description: Id de la lista a borrar.
 *       schema:
 *          type: number
 *   security:
 *      - bearerAuth: []
 *   responses:
 *      204:
 *         description: Lista borrada correctamente.
 *      401:
 *         description: Token no válido.
 *      400:
 *         description: Error en la petición.
 *      404:
 *         description: No se ha encontrado la lista.
 * 
 */
listaRouter.delete("/:idLista", auth.authenticate, listaController.deleteLista); 

//[PUT]/lista/<idLista>/ : Edita una lista.
/**
 * @swagger
 * /lista/{idLista}:
 *   put:
 *     tags: [Listas]
 *     summary: Edita una lista.
 *     description: Edita una lista.
 *     requestBody:
 *       content:
 *          application/json:
 *             schema:
 *                type: object
 *                properties:
 *                   nombre:
 *                      type: string
 *                   esAlbum:
 *                      type: boolean
 *                   esPrivada:
 *                      type: boolean
 *                   descripcion:
 *                      type: string
 *                   imgLista:
 *                      type: string
 *                   tipoLista:
 *                      $ref: '#/components/schemas/TipoLista'
 *                   idUsuario:
 *                      type: number
 *                   audios:
 *                      type: array
 *                      items:
 *                         type: number
 *     parameters:
 *       - in: path
 *         name: idLista
 *         required: true
 *         description: Id de la lista a editar.
 *         schema:
 *            type: number
 *     responses:
 *        200:
 *           description: Lista editada correctamente.
 *           content:
 *              application/json:
 *                 schema:
 *                    $ref: '#/components/schemas/Lista'
 *        400:
 *           description: Error en la petición.
 *        401:
 *           description: Token no válido.
 *        404:
 *           description: No se ha encontrado la lista.
 * 
 */
listaRouter.put("/:idLista", auth.authenticate, listaController.updateLista);

//[GET]/lista/<idLista>/ : Devuelve la información de una lista (sin audios, propietarios ni seguidores)
/**
 * @swagger
 * /lista/{idLista}:
 *   get:
 *     tags: [Listas] 
 *     summary: Devuelve la información de una lista (sin audios, propietarios ni seguidores)
 *     description: Devuelve la información de una lista (sin audios, propietarios ni seguidores)
 *     parameters:
 *       - in: path
 *         name: idLista
 *         required: true
 *         description: Id de la lista a obtener.
 *         schema:
 *            type: number
 *     responses:
 *        200:
 *           description: Lista obtenida correctamente.
 *           content:
 *              application/json:
 *                 schema:
 *                    $ref: '#/components/schemas/Lista'
 *        400:
 *           description: Error en la petición.
 *        404:
 *           description: No se ha encontrado la lista.
 * 
 */
listaRouter.get("/:idLista", auth.authenticate, listaController.getListaById);

//[GET]/lista/extra/Audios/<idLista>/ : Devuelve los audios de una lista.
listaRouter.get("/extra/Audios/:idLista", auth.authenticate, listaController.getAudiosFromLista);

//[GET]/lista/extra/Propietarios/<idLista>/ : Devuelve los propietarios de una lista.
listaRouter.get("/extra/Propietarios/:idLista", auth.authenticate, listaController.getPropietariosFromLista);

//[GET]/lista/extra/Seguidores/<idLista>/ : Devuelve los seguidores de una lista.
listaRouter.get("/extra/Seguidores/:idLista", auth.authenticate, listaController.getSeguidoresFromLista);

//[GET]/lista/extra/<idLista>/ : Devuelve la información de una lista (con audios, propietarios y seguidores)
listaRouter.get("/extra/:idLista", auth.authenticate, listaController.getListaByIdWithExtras);

//[POST]/lista/follow/<idLista>/ : Añade la lista a las seguidas por el usuario del jwt.
listaRouter.post("/follow/:idLista/", auth.authenticate, listaController.followLista);

//[DELETE]/lista/follow/<idLista>/ : Elimina la lista de las seguidas por el usuario del jwt.
listaRouter.delete("/follow/:idLista/", auth.authenticate, listaController.unfollowLista);

//[POST]/lista/audio/<idLista>/<idAudio> : Añade un audio a la lista.
listaRouter.post("/audio/:idLista/:idAudio", auth.authenticate, listaController.addAudioToLista);

//[DELETE]/lista/audio/<idLista>/<idAudio> : Elimina un audio de la lista.
listaRouter.delete("/audio/:idLista/:idAudio", auth.authenticate, listaController.deleteAudioFromLista);

//[POST]lista/collaborator/<idLista>/<idUsuario>/: Añade un colaborador a la lista.
listaRouter.post("/collaborator/:idLista/:idUsuario", auth.authenticate, listaController.addCollaboratorToLista);

//[DELETE]lista/collaborator/<idLista>/<idUsuario>/: Elimina un colaborador de la lista.
listaRouter.delete("/collaborator/:idLista/:idUsuario", auth.authenticate, listaController.deleteCollaboratorFromLista);

//[GET]listas/seguidas/<idUsuario>/: Devuelve las listas seguidas por un usuario.
listaRouter.get("/seguidas/:idUsuario", auth.authenticate, listaController.getFollowedLists);

//[GET]listas/owned/<idUsuario>/: Devuelve las listas de las que un usuario es propietario.
listaRouter.get("/owned/:idUsuario", auth.authenticate, listaController.getListasByUser);


export default listaRouter;