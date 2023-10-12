const AWS = require('aws-sdk');

    AWS.config.update({
        accessKeyId: "AKIAT7B3USE2DARGPK5A",
        secretAccessKey: "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",
        region: "us-east-2",
    });
    const rekognition = new AWS.Rekognition();

async function verificarFile(file){
    var baneado='pasable';
    const params = {
        Image: {
         Bytes: file.data,
        },

        MinConfidence: 20
     }
    const resultado = await new Promise((resolve, reject) => {
        rekognition.detectModerationLabels(params, (err, data) => err == null ? resolve(data) : reject(err));
    });
    // console.log(resultado);
    if(resultado.ModerationLabels.length>0)
    {
        switch (resultado.ModerationLabels[0].Name) {
        case 'Explicit Nudity':
            if (parseFloat(resultado.ModerationLabels[0].Confidence)>97.1) {
                 baneado='baneado';
                 return baneado;
            }
            break;
        case 'Nudity':
                if (parseFloat(resultado.ModerationLabels[1].Confidence)>96.8) {
                    baneado='baneado';
                    return baneado;
                }
                break;
        case 'Weapons':
                if (parseFloat(resultado.ModerationLabels[0].Confidence)>50) {
                    baneado='baneado';
                    return baneado;
                }
                break;
        case 'Drug Products':
                if (parseFloat(resultado.ModerationLabels[0].Confidence)>50) {
                    baneado='baneado';
                    return baneado;
                }
                break;
        case 'Drug Paraphernalia':
                if (parseFloat(resultado.ModerationLabels[0].Confidence)>50) {
                    baneado='baneado';
                    return baneado;
                }
                break;
        case 'Weapon Violence':
                if (parseFloat(resultado.ModerationLabels[0].Confidence)>90) {
                    baneado='baneado';
                    return baneado;
                }
                break;
        case 'Sexual Activity':
            if (parseFloat(resultado.ModerationLabels[1].Confidence)>80) {
                baneado='baneado';
                return baneado;
            }
            break;
        default:
                break;
        }
    // console.log('no entra aqui');
    if (resultado.ModerationLabels.length>1){
        switch (resultado.ModerationLabels[1].Name) {
            case 'Explicit Nudity':
                        if (parseFloat(resultado.ModerationLabels[0].Confidence)>97.1) {
                             baneado='baneado';
                             return baneado;
                        }
                        break;
            case 'Sexual Activity':
                if (parseFloat(resultado.ModerationLabels[1].Confidence)>80) {
                    baneado='baneado';
                    return baneado;
                }
                break;
            case 'Nudity':
                    if (parseFloat(resultado.ModerationLabels[1].Confidence)>96.8) {
                        baneado='baneado';
                        return baneado;
                    }
                    break;
            case 'Violence':
                    if (parseFloat(resultado.ModerationLabels[1].Confidence)>50) {
                        baneado='baneado';
                        return baneado;
                    }
                    break;
            case 'Drugs':
                    if (parseFloat(resultado.ModerationLabels[1].Confidence)>20) {
                        baneado='baneado';
                        return baneado;
                    }
                    break;

            case 'Illustrated Explicit Nudity':
                    if (parseFloat(resultado.ModerationLabels[1].Confidence)>85) {
                        baneado='baneado';
                        return baneado;
                    }
                    break;
            default:
                break;
        }
     }
    }
    return baneado;
}

module.exports= {
    verificarFile,
};