const socket = require("socket.io");
const ProductServices = require("../services/productServices.js");
const productServices = new ProductServices(); 
const MessageModel = require("../dao/models/message.model.js");

class SocketManager {
    constructor(httpServer) {
        this.io = socket(httpServer);
        this.initSocketEvents();
    }

    async initSocketEvents() {
        this.io.on("connection", async (socket) => {
            console.log("Un cliente se conectó");
            
            socket.on('eliminarProducto', async ({ id, user }) => {
                try {
                    console.log('Evento eliminarProducto recibido:', { id, user });
                    const product = await ProductModel.findById(id);
                    if (!product) {
                        socket.emit('error', 'Product not found');
                        return;
                    }

                    if (user.role === 'premium' && product.owner !== user.email) {
                        socket.emit('error', 'You can only delete your own products');
                        return;
                    }

                    if (user.role === 'admin' || (user.role === 'premium' && product.owner === user.email)) {
                        await ProductModel.deleteOne({ _id: id });
                        socket.emit('productDeleted', id);
                    } else {
                        socket.emit('error', 'Unauthorized action');
                    }
                } catch (error) {
                    socket.emit('error', error.message);
                }
            });
        
            /*socket.on("eliminarProducto", async (id, user) => {
                
                console.log("*** Id:" + id.pid);
                const product = await productServices.getProductById(id);
                console.log("*** producto:" + product);
                const owner = product.owner !== null ? product.owner : "";

                if (user.role === "admin" || (user.role === "premium" && owner === email)) {
                    await productServices.deleteProduct(id);
                    this.emitUpdatedProducts(socket);
                }
            });*/

            socket.on("agregarProducto", async (data) => {
                const { producto, role, email } = data;

                if (role === "admin" || role === "premium") {
                    producto.owner = email; // Asegurarse de que el dueño se establezca correctamente
                    await productServices.addProduct(producto);
                    this.emitUpdatedProducts(socket);
                }
            });

            socket.on("message", async (data) => {
                await MessageModel.create(data);
                const messages = await MessageModel.find();
                socket.emit("message", messages);
            });
        });
    }

    async emitUpdatedProducts(socket) {
        const productos = await productServices.getProducts();
        socket.emit("productos", productos.docs); // Emitir solo los documentos de productos
    }
}

module.exports = SocketManager;







/*const socket = require("socket.io");
const ProductServices = require("../services/productServices.js");
const productServices = new ProductServices(); 
const MessageModel = require("../dao/models/message.model.js");

class SocketManager {
    constructor(httpServer) {
        this.io = socket(httpServer);
        this.initSocketEvents();
    }

    async initSocketEvents() {
        this.io.on("connection", async (socket) => {
            console.log("Un cliente se conectó");
            
            socket.emit("productos", await productServices.getProducts());

            socket.on("eliminarProducto", async (data) => {
                const { id, role, email } = data;
                const product = await productServices.getProductById(id);

                if (role === "admin" || (role === "premium" && product.owner === email)) {
                    await productServices.deleteProduct(id);
                    this.emitUpdatedProducts(socket);
                }
            });

            socket.on("agregarProducto", async (data) => {
                const { producto, role, email } = data;

                if (role === "admin" || role === "premium") {
                    producto.owner = email; // Asegurarse de que el dueño se establezca correctamente
                    await productServices.addProduct(producto);
                    this.emitUpdatedProducts(socket);
                }
            });

            socket.on("message", async (data) => {
                await MessageModel.create(data);
                const messages = await MessageModel.find();
                socket.emit("message", messages);
            });
        });
    }

    

    async emitUpdatedProducts(socket) {
        socket.emit("productos", await productServices.getProducts());
    }
}

module.exports = SocketManager;*/










//CODIGO ORIGINAL
/*const socket = require("socket.io");
const ProductServices = require("../services/productServices.js");
const productServices = new ProductServices(); 
const MessageModel = require("../dao/models/message.model.js");

class SocketManager {
    constructor(httpServer) {
        this.io = socket(httpServer);
        this.initSocketEvents();
    }

    async initSocketEvents() {
        this.io.on("connection", async (socket) => {
            console.log("Un cliente se conectó");
            
            socket.emit("productos", await productServices.getProducts() );

            socket.on("eliminarProducto", async (id) => {
                await productServices.deleteProduct(id);
                this.emitUpdatedProducts(socket);
            });

            socket.on("agregarProducto", async (producto) => {
                await productServices.addProduct(producto);
                this.emitUpdatedProducts(socket);
            });

            socket.on("message", async (data) => {
                await MessageModel.create(data);
                const messages = await MessageModel.find();
                socket.emit("message", messages);
            });
        });
    }

    async emitUpdatedProducts(socket) {
        socket.emit("productos", await productServices.getProducts());
    }
}

module.exports = SocketManager;*/
