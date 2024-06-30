const UserModel = require("../dao/models/user.model.js");
const CartModel = require("../dao/models/cart.model.js");
const jwt = require("jsonwebtoken");
const { createHash, isValidPassword } = require("../utils/hashBcrypt.js");
const UserDTO = require("../dto/user.dto.js");
const {generateResetToken} = require("../utils/tokenReset.js");
const ViewsController = require("../controllers/view.controller.js");
const viewsController = new ViewsController()


//Diccionario de Errores Personalizado
const CustomError = require("../services/errors/custom-error.js");
const customError = new CustomError();
const Info = require("../services/errors/info.js");
const info = new Info();
const { EErrors } = require("../services/errors/enums.js");

const EmailManager = require("../services/email.js");
const UserServices = require("../services/user.services.js");
const userServices = new UserServices();
const emailManager = new EmailManager();

//Tercer Pre Entrega
class UserController {
    
    //Funciones para Usuarios
    async register(req, res) {
        const { first_name, last_name, email, password, age } = req.body;
        try {
            const existeUsuario = await UserModel.findOne({ email });
            if (existeUsuario) {
                return res.status(400).send("El usuario ya existe");
            }

            //Creo un nuevo carrito: 
            const nuevoCarrito = new CartModel();
            await nuevoCarrito.save();

            const nuevoUsuario = new UserModel({
                first_name,
                last_name,
                email,
                cart: nuevoCarrito._id, 
                password: createHash(password),
                age/*,
                role: email === 'adminCoder@coder.com' ? 'Admin' : 'usuario'*/
            });

            await nuevoUsuario.save();

            const token = jwt.sign({ user: nuevoUsuario }, "coderhouse", {
                expiresIn: "1h"
            });
            console.log(token)
            res.cookie("coderCookieToken", token, {
                maxAge: 3600000,
                httpOnly: true
            });
            if (res.headersSent) {
                console.log("Cookie establecida correctamente.");
            } else {
                console.log("Error al establecer la cookie.");
            }

            res.redirect("/api/users/profile");
        } catch (error) {
            console.error(error);
            res.status(500).send("Error interno del servidor");
        }
    }

    async login(req, res) {
        const { email, password } = req.body;
        try {
            const usuarioEncontrado = await UserModel.findOne({ email });

            if (!usuarioEncontrado) {
                customError.createError({
                    name: "Email no encontrado",
                    cause: info.emailNotFound({email}),
                    message: "Error al buscar el Email",
                    code: EErrors.AUTHENTICACION
                } )
            }
            console.log(usuarioEncontrado, "hola!");

            const esValido = isValidPassword(password, usuarioEncontrado);
            if (!esValido) {
                return res.status(401).send("Contraseña incorrecta");
            }

            const token = jwt.sign({ user: usuarioEncontrado }, "coderhouse", {
                expiresIn: "1h"
            });

            res.cookie("coderCookieToken", token, {
                maxAge: 3600000,
                httpOnly: true
            });

            res.redirect("/api/users/profile");
            if (res.headersSent) {
                console.log("Cookie establecida correctamente.");
            } else {
                console.log("Error al establecer la cookie.");
            }
        } catch (error) {
            console.error(error);
            res.status(500).send("Error interno del servidor");
        }
    }
    /*async login(req, res) {
        const { email, password } = req.body;
        try {
            const usuarioEncontrado = await UserModel.findOne({ email });

            if (!usuarioEncontrado) {
                return res.status(401).send("Usuario no válido");
            }

            const esValido = isValidPassword(password, usuarioEncontrado);
            if (!esValido) {
                return res.status(401).send("Contraseña incorrecta");
            }

            const token = jwt.sign({ user: usuarioEncontrado }, "coderhouse", {
                expiresIn: "1h"
            });

            res.cookie("coderCookieToken", token, {
                maxAge: 3600000,
                httpOnly: true
            });

            res.redirect("/api/users/profile");
            if (res.headersSent) {
                console.log("Cookie establecida correctamente.");
            } else {
                console.log("Error al establecer la cookie.");
            }
        } catch (error) {
            console.error(error);
            res.status(500).send("Error interno del servidor");
        }
    }*/

    async profile(req, res) {
        //Con DTO: 
        const userDto = new UserDTO(req.user.first_name, req.user.last_name, req.user.email, req.user.role, req.user.last_connection);
        const isAdmin = req.user.role === 'admin';
        const isPremium = req.user.role === 'premium';
        res.render("profile", { user: userDto, isAdmin, isPremium });
    }

    async logout(req, res) {
        res.clearCookie("coderCookieToken");
        res.redirect("/login");
    }

    async admin(req, res) {
        if (req.user.role !== "admin") {
            return res.status(403).send("Acceso denegado");
        }
        res.render("admin");
    }

    //Nuevo Código Tercer Práctica Integradora: 
    async requestPasswordReset(req, res) {
        const { email } = req.body;

        try {
            // Buscar al usuario por su correo electrónico
            const user = await UserModel.findOne({ email });
            if (!user) {
                return res.status(404).send("Usuario no encontrado");
            }

            // Generar un token 
            const token = generateResetToken();

            // Guardar el token en el usuario
            user.resetToken = {
                token: token,
                expiresAt: new Date(Date.now() + 3600000) // 1 hora de duración
            };
            await user.save();
            console.log("antes d eenviar el email")

            // Enviar correo electrónico con el enlace de restablecimiento utilizando EmailService
            await emailManager.sendPasswordResetEmail(email, user.first_name, token);

            console.log("despues de enviar el email")
            res.redirect("/resetpasswordconfirmation");
        } catch (error) {
            console.error(error);
            res.status(500).send("Error interno del servidor");
        }
    }

    async resetPassword(req, res) {
        const { email, password, token } = req.body;

        try {
            // Buscar al usuario por su correo electrónico
            const user = await UserModel.findOne({ email });
            if (!user) {
                return res.render("newpassword", { error: "Usuario no encontrado" });
            }

            // Obtener el token de restablecimiento de la contraseña del usuario
            const resetToken = user.resetToken;
            if (!resetToken || resetToken.token !== token) {
                return res.render("resetpassword", { error: "El token de restablecimiento de contraseña es inválido" });
            }

            // Verificar si el token ha expirado
            const now = new Date();
            if (now > resetToken.expiresAt) {
                // Redirigir a la página de generación de nuevo correo de restablecimiento
                return res.redirect("/newpassword");
            }

            // Verificar si la nueva contraseña es igual a la anterior
            if (isValidPassword(password, user)) {
                return res.render("newpassword", { error: "La nueva contraseña no puede ser igual a la anterior" });
            }

            // Actualizar la contraseña del usuario
            user.password = createHash(password);
            user.resetToken = undefined; // Marcar el token como utilizado
            await user.save();

            // Renderizar la vista de confirmación de cambio de contraseña
            return res.redirect("/login");
        } catch (error) {
            console.error(error);
            return res.status(500).render("resetpassword", { error: "Error interno del servidor" });
        }
    }


    async uploadDocs(req, res) {
        const { uid } = req.params
        const uploadedDocuments = req.files

        try {
            console.log("uploadedDocuments");
            // Se valida si existe el usuario en la base de datos
            const user = await userServices.findById(uid)
            if (!user) {
                return res.status(404).json({ message: 'User not found' })
            }

            // Se verifica si se subieron documentos y se actualiza el usuario
            if (uploadedDocuments) {
                if (uploadedDocuments.document) {
                    user.documents = user.documents.concat(uploadedDocuments.document.map(doc => ({
                        name: doc.originalname,
                        reference: doc.path
                    })))
                }
                if (uploadedDocuments.products) {
                    user.documents = user.documents.concat(uploadedDocuments.products.map(doc => ({
                        name: doc.originalname,
                        reference: doc.path
                    })))
                }
                if (uploadedDocuments.profile) {
                    user.documents = user.documents.concat(uploadedDocuments.profile.map(doc => ({
                        name: doc.originalname,
                        reference: doc.path
                    })))
                }
            }

            // Se guardan los cambios en la base de datos
            await user.save()

            res.status(200).json({ message: 'Documents uploaded successfully' })
        } catch (error) {
            console.error('Error uploading user documents:', error)
            res.status(500).json({ message: 'Internal server error' })
        }
    }

    async changeRolPremium(req, res) {
        try {
            const { uid } = req.params;

            const user = await UserModel.findById(uid);

            if (!user) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            // Verificar si el usuario ha cargado los documentos requeridos
            const requiredDocuments = ['Identificacion', 'Comprobante de domicilio', 'Comprobante de estado de cuenta'];
        
            // Extraemos los nombres base de los documentos que el usuario ha subido
            const userDocuments = user.documents ? user.documents.map(doc => doc.name.split('.')[0]) : [];

            const hasRequiredDocuments = requiredDocuments.every(doc => userDocuments.includes(doc));

            if (!hasRequiredDocuments) {
                return res.status(400).json({ message: 'El usuario debe cargar los siguientes documentos: Identificación, Comprobante de domicilio, Comprobante de estado de cuenta' });
            }

            const nuevoRol = user.role === 'usuario' ? 'premium' : 'usuario';

            const actualizado = await UserModel.findByIdAndUpdate(uid, { role: nuevoRol }, { new: true });
            res.json(actualizado);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    }


    //Apartado del Administrador
    async getUsers(req, res) {
        try {
            const users = await UserModel.find().sort({ last_connection: 1 }); // 1 para orden ascendente

            // Mapear a UserDTO
            const usersDto = users.map(user => new UserDTO(user.first_name, user.last_name, user.email, user.role, user.last_connection));

            res.status(200).json({ status: "Success", users: usersDto });

        } catch (error) {
            logger.error(error);
            return res.json({ message: 'Error interno del servidor' });
        }
    }

    async deleteOldUsers(req, res) {
        try {
            // Elimino los usuarios que estuvieron inactivos durante dos días
            const twoDaysAgo = new Date(Date.now() - 2 * 86400000);

            // Buscar usuarios inactivos o sin last_connection
            const inactiveUsers = await UserModel.find({
                $or: [
                    { last_connection: { $lt: twoDaysAgo } },
                    { last_connection: { $exists: false } }
                ]
            });

            // Enviar correos a los usuarios inactivos antes de eliminarlos
            for (const user of inactiveUsers) {
                await emailManager.deletedNotification(user.email, user.first_name, "Eliminación por inactividad", "Tu cuenta ha sido eliminada por inactividad.");
            }

            // Eliminar usuarios inactivos o sin last_connection
            await UserModel.deleteMany({
                $or: [
                    { last_connection: { $lt: twoDaysAgo } },
                    { last_connection: { $exists: false } }
                ]
            });

            // Renderizar la vista de usuarios después de la eliminación
            viewsController.renderUsers(req, res);

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    }

    async deleteUser(req, res) {
        try {
            const { uid } = req.params;
            const user = await UserModel.findById(uid);

            if (user) {
                // Enviar correo al usuario antes de eliminarlo
                await emailManager.sendNotificationEmail(user.email, user.first_name, "Cuenta eliminada", "Tu cuenta ha sido eliminada porque no cumple con los requisitos de la tienda.");

                // Eliminar el usuario
                await UserModel.findByIdAndDelete(uid);
            }

            viewsController.renderUsers(req, res);
        } catch (error) {
            logger.error(error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
    /*async changeRolPremium(req, res) {
        try {
            const { uid } = req.params;
    
            const user = await UserModel.findById(uid);
    
            if (!user) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }
    
            const newRol = user.role === 'usuario' ? 'premium' : 'usuario';
    
            const updated = await UserModel.findByIdAndUpdate(uid, { role: newRol }, { new: true });
            res.json(updated);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    }*/
}

module.exports = UserController;
