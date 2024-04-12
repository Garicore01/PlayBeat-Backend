import { Response , NextFunction} from "express";
import { Request } from 'express-jwt';

import prisma from "../../prisma/client.js";
import path from 'path';
import fs from 'fs';
import mediaserver from 'mediaserver'; //Variable para manejar archivos de audio, usa chunks para enviar el archivo
import * as etiquetasDatabase from "../../db/etiquetasDb.js";
import * as audioDatabase from "../../db/audioDb.js";
import { promisify } from 'util';






const projectRootPath = process.cwd(); // Devuelve el directorio raíz del proyecto y se almacena en una constante




//PRE: Se recibe un id de audio correcto en la URL
//POST: Sube obtiene información de un audio con formato JSON
export async function getAudio(req: Request, res: Response) {
    try {
        const id = Number(req.params.idaudio);

        if (req.body.audioConsulta.esPrivada && !await isOwnerOrAdmin(req)) { //Falta lógica de verificación de usarios
            res.status(403).send("Unauthorized");
        }else{
            const artistas = await audioDatabase.getArtistaAudioById(id);
            res.json({...req.body.audioConsulta, artistas});
        }

    } catch (error) {
        res.status(500).send(error); // Internal server error
    }
}

//Se encarga de verificar que los usuarios existan en la base de datos
export async function verifyUsersList(req: Request, res: Response, next: NextFunction) {
    try {
        if (req.body.idsUsuarios) {
            const idsUsuarios = req.body.idsUsuarios.split(',').map(Number);
            for (const idUsuario of idsUsuarios) {
                //Preguntar Alvaro si tiene esta función
                const usuario = await prisma.usuario.findUnique({
                    where: {
                        idUsuario: idUsuario,
                    },
                });
                if (!usuario) {
                    return res.status(404).send('Usuario no encontrado');            
                }
            }
        }
        next();
    }catch (error) {
        return res.status(500).send(error);            
    }
}


//Se encarga de verificar que los usuarios existan en la base de datos
export async function verifyLabelList(req: Request, res: Response, next: NextFunction) {
    try {
        if (req.body.etiquetas) {
            if (req.body.tipoEtiqueta==="Podcast" || req.body.tipoEtiqueta==="Cancion") {
                const etiquetas = req.body.etiquetas.split(',').map(Number);
                for (const idEtiqueta of etiquetas) {
                    if (await etiquetasDatabase.existsTag(idEtiqueta)==false) {
                        return res.status(404).send('Etiqueta no encontrada');
                    }
                }
            }else{
                return res.status(400).send('Bad Parameters, etiqueta no válida');
            }
        }else if (!req.body.etiquetas && req.body.tipoEtiqueta) {
            return res.status(400).send('Bad Parameters, faltan las etiquetas');
        }
        next();
    }catch (error) {
        return res.status(404);            
    }
}

export async function createAudio(req: Request, res: Response) {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded');
        }
        if (!req.body.titulo        ||
            !req.body.duracionSeg   ||
            !req.body.fechaLanz     || 
            !req.body.esAlbum       ||
            !req.body.esPrivada) {
                return res.status(400).send('Bad Parameters, faltan parámetros');

        }
        const fechaLanz = new Date(req.body.fechaLanz);
        const fechaFormateada = fechaLanz.toISOString();
        let idsUsuarios2: number[] = [];
        idsUsuarios2.push(req.auth?.idUsuario);
        if (req.body.idsUsuarios) {
            idsUsuarios2 = req.body.idsUsuarios.split(',').map(Number);
        }
        let img = "null";
        if (req.body.img ) {
            img = req.body.img;
        }
        console.log(req.body)
        fs.rename(path.join(projectRootPath,'tmp',req.file.filename), path.join(projectRootPath,'audios',req.file.filename), function(err) {
            if (err) throw err;
            console.log('File moved');
        });
        const audio = await audioDatabase.createAudioDB(req.body.titulo, req.file.filename, parseInt(req.body.duracionSeg, 10), fechaFormateada, Boolean(req.body.esAlbum), Boolean(req.body.esPrivada), idsUsuarios2,img);
    
        if (req.body.etiquetas) {
            if (req.body.tipoEtiqueta==="Podcast" || req.body.tipoEtiqueta==="Cancion") {
                const etiquetas = req.body.etiquetas.split(',').map(Number);
                for (const idEtiqueta of etiquetas) {
                    await audioDatabase.linkLabelToAudio(audio.idAudio, idEtiqueta, req.body.tipoEtiqueta);
                }
            }else{
                return res.status(400).send('Bad Parameters, etiqueta no válida');
            }
        }else if (!req.body.etiquetas && req.body.tipoEtiqueta) {
            return res.status(400).send('Bad Parameters, faltan las etiquetas');
        }

        for (const idUsuario of idsUsuarios2) {
            //Preguntar Alvaro si tiene esta función
            await prisma.usuario.update({
                where: {
                    idUsuario: idUsuario,
                },
                data: {
                    Audios: {
                        connect: { idAudio: audio.idAudio },
                    },
                },
            });
            await audioDatabase.addPropietariosToAudio(audio.idAudio, idsUsuarios2);
        }

        res.json( { message: 'Audio added successfully' ,idaudio: audio.idAudio});

        
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
            if (error.stack) {
                console.error(`Stack trace: ${error.stack}`);
            }
        }
        res.status(500).send(error);
    }
}


export async function deleteAudio(req: Request, res: Response) {

    try {
        const id = Number(req.params.idaudio);
        if (!await isOwnerOrAdmin(req)){
            return res.status(403).send("Unauthorized");
        }
        audioDatabase.deleteAudioById(id);
        try{
            deleteFile(path.join(projectRootPath,req.body.audioConsulta.path));
        }catch (error){
            return res.status(404).send(error);            
        }
        res.json({ message: 'Audio deleted successfully' });
    } catch (error) {
        res.status(500).send(error);
    }
}

export async function verifyAudio(req: Request, res: Response, next: NextFunction) {
    
    try {
        if (!req.params.idaudio) {
            return res.status(400).send('Bad Parameters, idaudio not found');
        }
        const id = Number(req.params.idaudio);
        const audioConsulta = await audioDatabase.findAudioById(id);
        if (!audioConsulta) {
            return res.status(404).send("Audio not found");            
        }

        req.body.audioConsulta = audioConsulta; // Adjuntar audioConsulta al objeto req

        next(); // Pasar al siguiente middleware si audioConsulta existe
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
            if (error.stack) {
                console.error(`Stack trace: ${error.stack}`);
            }
            res.status(500).send(error);
        }
    }
}

export async function updateAudio(req: Request, res: Response) {
    try {
        if (!await isOwnerOrAdmin(req)){
            return res.status(403).send("Unauthorized");
        }
        let audioData: any = {};
        if (req.file){
            fs.rename(path.join(projectRootPath,'tmp',req.file.filename), path.join(projectRootPath,'audios',req.file.filename), function(err) {
                if (err) throw err;
                console.log('File moved');
            });

            audioData.path = "/audios/"+req.file.filename;
            try{
                deleteFile(path.join(projectRootPath,req.body.audioConsulta.path)); // Acceder a audioConsulta desde req
            }catch (error){
                // No se hace nada si no se encuentra el archivo, no pasa nada
            }
        }

        if (req.body.titulo) {
            audioData.titulo = req.body.titulo;
        }
        if (req.body.duracionSeg) {
            audioData.duracionSeg = parseInt(req.body.duracionSeg, 10);
        }
        if (req.body.fechaLanz) {
            const fechaLanz = new Date(req.body.fechaLanz);
            audioData.fechaLanz = fechaLanz.toISOString();
        }
        if (req.body.esAlbum) {
            audioData.esAlbum = req.body.esAlbum;
        }

        if (req.body.esPrivada) {
            audioData.esPrivada = Boolean(req.body.esPrivada);
        }
        if (req.body.img) {
            audioData.imgAudio = req.body.img;
            
        }
        
        audioDatabase.updateAudioById(Number(req.params.idaudio),audioData);

        if (req.body.etiquetas) {
            if (req.body.tipoEtiqueta==="Podcast" || req.body.tipoEtiqueta==="Cancion") {
                console.log(req.body.etiquetas);
                const etiquetas = req.body.etiquetas.split(',').map(Number);
                for (const idEtiqueta of etiquetas) {
                    await audioDatabase.linkLabelToAudio(Number(req.params.idaudio), idEtiqueta, req.body.tipoEtiqueta);
                }
            }else{
                return res.status(400).send('Bad Parameters, etiqueta no válida');
            }
        }else if (!req.body.etiquetas && req.body.tipoEtiqueta) {
            return res.status(400).send('Bad Parameters, faltan las etiquetas');
        }

        res.json( { message: 'Audio updated successfully' } );
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
            if (error.stack) {
                console.error(`Stack trace: ${error.stack}`);
            }
            res.status(500).send(error);
        }
    }
}


export async function playAudio(req: Request, res: Response) {
    try {
        if (!req.params.idaudio) {
            return res.status(400).send('Bad Parameters');
        }
        const audio = await audioDatabase.findAudioById(Number(req.params.idaudio));
        if (!audio) {
            return res.status(404).send("Audio not found");            
        }
        const cancion = path.join(projectRootPath, audio.path);
        const access = promisify(fs.access);
        await access(cancion, fs.constants.F_OK);
        if (!audio.esPrivada || await isOwnerOrAdmin(req)){
            mediaserver.pipe(req, res, cancion);
        }else{
            return res.status(403).send("Unauthorized");
        }
    } catch (err) {
        res.status(404).send('File not found');
    }
}

export function deleteTmpFiles(req: Request, res: Response, next: NextFunction){
    const folder = path.join(projectRootPath,'tmp');
    fs.readdir(folder, (err, files) => {
        if (err) {
            console.error(err);
            return;
        }
        for (const file of files) {
            fs.unlink(path.join(folder, file), err => {
                if (err) {
                    console.error(err);
                    return;
                }
            });
        }
    });
    next();
}


function deleteFile(filePath: string) {
    try {
        fs.unlinkSync(filePath); // Borra el archivo del servidor
    } catch (error) {
        throw new Error('Error, audio no eliminando, no encontrado en el servidor local');
    }
}

async function isOwnerOrAdmin(req: Request){
        if (!req.auth?.esAdmin) {
            const propietarios = await audioDatabase.getArtistaAudioById(parseInt(req.params.idaudio));

            if (propietarios.length === 0) {
                throw new Error("Audio no encontrado");
            }
            if (!propietarios.includes(parseInt(req.auth?.idUsuario))) {
                return false;
            }
        }
        return true;
}
