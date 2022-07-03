'use strict';
const nodemailer = require('nodemailer');
require('dotenv').config();
this.enviar_mail = (email,codigo,nombre,res) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAILUSER,
            pass: process.env.MAILPSSWD
        }
    });
    let mailOptions = {
        from: 'Gowin',
        to: email,
        subject: `Bienvenido ${nombre}`,
        html: `
            <table border="0" cellpadding="0" cellspacing="0" width="600px" background-color="#2d3436" bgcolor="#2d3436">
            <tr height="200px">  
                <td bgcolor="" width="600px">
                    <h1 style="color: #fff; text-align:center">Numero de verificación</h1>
                    <p  style="color: #fff; text-align:center">
                        <h1>${codigo}</h1>
                    </p>
                </td>
            </tr>
            <tr bgcolor="#fff">
                <td style="text-align:center">
                    <p style="color: #000">¡Sea bienvenido a Gowin ingrese el codigo de verificacion en la aplicacion!</p>
                    <p style="color: #000">:)</p>
                </td>
            </tr>
            </table>
        
        `
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
             console.log(error);
            return;
        } else {
            //console.log('Correo se envió con éxito: ' + info.response);
            return;
        }
    });
};
module.exports = this;