const ProductModel = require("../dao/models/product.model.js");
const ProductServices = require("../services/productServices.js");
const productServices = new ProductServices();
const CartServices = require("../services/cartServices.js");
const cartServices = new CartServices();
const UserModel = require("../dao/models/user.model.js");
const UserDTO = require("../dto/user.dto.js");

class ViewsController {
  async renderProducts(req, res) {
    try {


      let criterioDeBusqueda = [];
      const owner = req.user.role;
      if (owner !=="admin") {
        criterioDeBusqueda.push({
          $match:{
            owner:{$ne:owner}
          }
        })

      }


      const { page = 1, limit = 3 } = req.query;

      const skip = (page - 1) * limit;
      
      criterioDeBusqueda.push({
        $skip: skip,
    }, {
        $limit: limit,
    });

      const productos = await ProductModel.aggregate(criterioDeBusqueda);

      const totalProducts = await ProductModel.countDocuments(criterioDeBusqueda[0]?.['$match']);

      const totalPages = Math.ceil(totalProducts / limit);

      const hasPrevPage = page > 1;
      const hasNextPage = page < totalPages;

      /*const nuevoArray = productos.map((producto) => {
        const { _id, ...rest } = producto.toObject();
        return { id: _id, ...rest }; // Agregar el ID al objeto
      });*/

      let cartId = null; // Inicializamos cartId como null

      // Verificamos si req.user existe y tiene la propiedad cart
      if (req.user && req.user.cart) {
        cartId = req.user.cart.toString();
      }

      res.render("products", {
        productos: productos,
        hasPrevPage,
        hasNextPage,
        prevPage: page > 1 ? parseInt(page) - 1 : null,
        nextPage: page < totalPages ? parseInt(page) + 1 : null,
        currentPage: parseInt(page),
        totalPages,
        cartId: req.user ? req.user.cart : null,
      });
    } catch (error) {
      console.error("Error al obtener productos", error);
      res.status(500).json({
        status: "error",
        error: "Error interno del servidor",
      });
    }
  } 

  async renderIndex(req, res) {
    try {
      const productos = await productServices.getProducts();
      const nuevoArray = productos.docs.map((producto) => {
        const { _id, ...rest } = producto.toObject();
        return rest;
      });

      res.render("index", {
        productos: nuevoArray,
        /*user: req.session.user*/
      });
    } catch (error) {
      console.error("Error al obtener productos", error);
      res.status(500).json({
        error: "Error interno del servidor",
      });
    }
  }

  async renderCart(req, res) {
    const cartId = req.params.cid;

    try {
      const carrito = await cartServices.getCarritoById(cartId);

      if (!carrito) {
        console.log("No existe ese carrito con el id");
        return res.status(404).json({ error: "Carrito no encontrado" });
      }

      let totalCompra = 0;

      const productosEnCarrito = carrito.products.map((item) => {
        const product = item.product ? item.product.toObject() : null;
        const quantity = item.quantity;
        const totalPrice = (product ? product.price : 0) * quantity;

        totalCompra += totalPrice;

        return {
          product: { ...product, totalPrice },
          quantity,
          cartId,
        };
      });
      

      res.render("carts", { productos: productosEnCarrito, totalCompra, cartId });
    } catch (error) {
      console.error("Error al obtener el carrito", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  //      USUARIOS

  // Vista al perfil
  async renderProfile(req, res) {
    res.render("profile", { user: req.session.user });
  }

  // Vista al Login
  async renderLogin(req, res) {
    res.render("login");
  }
  // Vista a Registro
  async renderRegister(req, res) {
    res.render("register");
  }

  // Vista a Productos en tiempo real
  async renderRealTimeProducts(req, res) {
     try {
      let criterioDeBusqueda = [];
      const owner = req.user.role;
      const userEmail = req.user.email

      if (owner !=="admin") {
        criterioDeBusqueda.push({
          $match:{
            owner:userEmail
          }
        })
      }
      console.log(owner)


      const { page = 1, limit = 3 } = req.query;

      const skip = (page - 1) * limit;
      
      criterioDeBusqueda.push({
        $skip: skip,
    }, {
        $limit: limit,
    });

      const productos = await ProductModel.aggregate(criterioDeBusqueda);

      const totalProducts = await ProductModel.countDocuments(criterioDeBusqueda[0]?.['$match']);

      const totalPages = Math.ceil(totalProducts / limit);

      const hasPrevPage = page > 1;
      const hasNextPage = page < totalPages;

      /*const nuevoArray = productos.map((producto) => {
        const { _id, ...rest } = producto.toObject();
        return { id: _id, ...rest }; // Agregar el ID al objeto
      });*/

      let cartId = null; // Inicializamos cartId como null

      // Verificamos si req.user existe y tiene la propiedad cart
      if (req.user && req.user.cart) {
        cartId = req.user.cart.toString();
      }
    
    
    res.render("realtimeproducts", {
        productos: productos,
        hasPrevPage,
        hasNextPage,
        prevPage: page > 1 ? parseInt(page) - 1 : null,
        nextPage: page < totalPages ? parseInt(page) + 1 : null,
        currentPage: parseInt(page),
        totalPages,
        
      });;
    } catch (error) {
      console.log("error en la vista real time", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // Vista al Chat
  async renderChat(req, res) {
    res.render("chat");
  }




  //Reseteo de password:
async renderPasswordConfirmation(req, res){
  res.render("resetpasswordconfirmation")
}

async renderNewPassword(req, res){
  res.render("newpassword")
}

async renderResetPassword(req, res){
  res.render("resetpassword")
}

async renderConfirmacion(req, res) {
  res.render("confirmacion-envio");
}

async renderPremium(req, res) {
  if (!req.user || res.locals.isUserAdmin) {
    return res.redirect('/')
}
  res.render("panel-premium");
}

async renderUsers(req, res) {
  try {
      const loggedInUserId = req.user._id; 
      const role = req.user.role;

      // Contar la cantidad total de usuarios excepto el logueado
      const totalUsers = await UserModel.countDocuments({ _id: { $ne: loggedInUserId } });

      // Paginación
      let criteria = [
          { $match: { _id: { $ne: loggedInUserId } } }, // Excluir el usuario logueado
      ];

      const users = await UserModel.aggregate(criteria);
      const usersDto = users.map(user => new UserDTO(user.first_name, user.last_name, user.email, user.role, user.last_connection));

          res.render("users", {
          users: usersDto,
          docs: usersDto,
          role:  role,
      });

  } catch (error) {
      console.error("Error al obtener los usuarios", error);
      res.status(500).json({ error: "Error interno del servidor" });
  }
}


}
module.exports = ViewsController;