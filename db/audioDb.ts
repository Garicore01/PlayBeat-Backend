import prisma from "../prisma/client.js";

export async function findAudioById(id: number) {
    const audioRuta = await prisma.audio.findUnique({
        where: {
            idAudio: id,
        },
    });
    return audioRuta;
}

export async function deleteAudioById(id: number) {
    await prisma.audio.delete({
        where: {
            idAudio: id,
        },
    });
}

export async function createAudioDB(audioData: any) {
    const audio = await prisma.audio.create({
        data: audioData
    });
    return audio;
}

//Lo campos indicados en data deben de ser los mismos que en la base de datos
//en caso contrario, se generará un error
export async function updateAudioById(id: number, audioData: any) {
    await prisma.audio.update({
        where: { idAudio: id },
        data: audioData,
    });
}