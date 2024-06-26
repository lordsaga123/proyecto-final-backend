const nodemailer = require('nodemailer');

class EmailManager {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            auth: {
                user: "pruebacoder80@gmail.com",
                pass: "daqy irzn pmuq iami"
            }
        });
    }

    async sendEmailPurchase(email, first_name, ticket) {
        try {
            const mailOptions = {
                from: "Coder Test <pruebacoder80@gmail.com>",
                to: email,
                subject: 'Confirmación de compra',
                html: `
                    <h1>Confirmación de compra</h1>
                    <p>Gracias por tu compra, ${first_name}!</p>
                    <p>El número de tu orden es: ${ticket}</p>
                `
            };

            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Error al enviar el correo electrónico:', error);
        }
    }

    async sendPasswordResetEmail(email, first_name, token) {
        try {
            const mailOptions = {
                from: 'pruebacoder80@gmail.com',
                to: email,
                subject: 'Restablecimiento de Contraseña',
                html: `
                    <h1>Restablecimiento de Contraseña</h1>
                    <p>Hola ${first_name},</p>
                    <p>Has solicitado restablecer tu contraseña. Utiliza el siguiente código para cambiar tu contraseña:</p>
                    <p><strong>${token}</strong></p>
                    <p>Este código expirará en 1 hora.</p>
                    <a href="http://localhost:8080/newpassword">Restablecer Contraseña</a>
                    <p>Si no solicitaste este restablecimiento, ignora este correo.</p>
                `
            };

            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error("Error al enviar correo electrónico:", error);
            throw new Error("Error al enviar correo electrónico");
        }
    }

    async deletedNotification(email, first_name, last_name) {
        try {
            const mailOptions = {
                from: 'pruebacoder80@gmail.com',
                to: email,
                subject: 'Eliminación de Cuenta',
                html: `
                <h1>Estimado ${first_name} ${last_name},</h1>
                <p>Nos comunicamos por este medio para darle aviso de que su cuenta ha sido eliminada debido a dos días de inactividad.</p>
                <p>Puede contactarse con nuestro equipo de soporte para solicitar la alta nuevamente</p>

                <p>Gracias por su comprensión.</p>
                <p>Atentamente,</p>
                <p>El equipo de E-Commerce.</p>
                `
            }
            await this.transporter.sendMail(mailOptions)
        } catch (error) {
            console.error('Error enviando email:', error)
            throw new Error('Error enviando email')
        }
    }

    async sendProductUserDeletionEmail(email, first_name, last_name, product_name) {
        try {
            const mailOptions = {
                from: 'pruebacoder80@gmail.com',
                to: email,
                subject: 'Eliminación de Producto',
                html: `
                <h1>Dear ${first_name} ${last_name},</h1>
                <p>Nos comunicamos por este medio para darle aviso de que su producto <strong>${product_name}</strong> ha sido eliminado de nuestro sitio debido al incumplimiento de nuestras políticas.</p>

                <p>Puede contactarse con nuestro equipo de soporte para solicitar la alta del mismo nuevamente</p>

                <p>Gracias por su comprensión.</p>
                <p>Atentamente,</p>
                <p>El equipo de E-Commerce.</p>
                `
            }
            await this.transporter.sendMail(mailOptions)
        } catch (error) {
            console.error('Error sending email:', error)
            throw new Error('Error sending email')
        }
    }
}

module.exports = EmailManager;