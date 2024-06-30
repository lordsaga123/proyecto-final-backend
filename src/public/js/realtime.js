document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // Verificar que las variables globales están definidas
    console.log('User Role:', window.userRole);
    console.log('User Email:', window.userEmail);

    document.getElementById('btnEnviar').addEventListener('click', () => {
        const producto = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            price: document.getElementById('price').value,
            img: document.getElementById('img').value,
            code: document.getElementById('code').value,
            stock: document.getElementById('stock').value,
            category: document.getElementById('category').value,
            status: document.getElementById('status').value,
        };

        const user = {
            role: window.userRole,
            email: window.userEmail
        };

        console.log("Datos enviados en agregarProducto:", { producto, user });
        socket.emit('agregarProducto', { producto, ...user });
        location.reload();
    });

    socket.on('productos', productos => {
        if (!Array.isArray(productos)) {
            console.error("Expected an array but got", productos);
            return;
        }

        const contenedorProductos = document.getElementById('contenedorProductos');
        contenedorProductos.innerHTML = '';

        productos.forEach(producto => {
            const productCard = document.createElement('div');
            productCard.classList.add('card');

            productCard.innerHTML = `
                <p>Nombre: ${producto.title}</p>
                <p>Descripción: ${producto.description}</p>
                <p>Precio: ${producto.price}</p>
                <p>Stock: ${producto.stock}</p>
                <p>Owner: ${producto.owner}</p>
                ${(window.userRole === 'admin' || window.userEmail === producto.owner) ? `<button class="delete-button" data-id="${producto._id}">Eliminar</button>` : ''}
            `;

            contenedorProductos.appendChild(productCard);
        });

        // Verificar que los botones de eliminación existen y tienen el atributo data-id correcto
        const deleteButtons = document.querySelectorAll('.delete-button');
        console.log('Total botones de eliminación encontrados:', deleteButtons.length);

        deleteButtons.forEach(button => {
            console.log('Botón de eliminación encontrado:', button); // Verifica que los botones se encuentran
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-id');
                const user = {
                    role: window.userRole,
                    email: window.userEmail
                };
                console.log("Datos enviados en eliminarProducto:", { id, user });
                socket.emit('eliminarProducto', { id, user });
            });
        });
    });

    socket.on('productDeleted', (productId) => {
        console.log(`Producto eliminado: ${productId}`);
        const productElement = document.querySelector(`[data-id='${productId}']`);
        if (productElement) {
            productElement.parentElement.remove();
        }
    });

    socket.on('error', (message) => {
        console.error('Error recibido del servidor:', message);
        alert(message);
    });
});






/*const socket = io();

document.getElementById('btnEnviar').addEventListener('click', () => {
    const producto = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        price: document.getElementById('price').value,
        img: document.getElementById('img').value,
        code: document.getElementById('code').value,
        stock: document.getElementById('stock').value,
        category: document.getElementById('category').value,
        status: document.getElementById('status').value,
    };

    const user = {
        role: window.userRole,
        email: window.userEmail
    };

    socket.emit('agregarProducto', { producto, ...user });
});

document.querySelectorAll('.delete-button').forEach(button => {
    button.addEventListener('click', () => {
        const id = button.getAttribute('data-id');
        const user = {
            role: window.userRole,
            email: window.userEmail
        };

        socket.emit('eliminarProducto', { id, ...user });
    });
});

socket.on('productos', productos => {
    const contenedorProductos = document.getElementById('contenedorProductos');
    contenedorProductos.innerHTML = '';

    productos.forEach(producto => {
        const productCard = document.createElement('div');
        productCard.classList.add('card');

        productCard.innerHTML = `
            <p>Nombre: ${producto.title}</p>
            <p>Descripción: ${producto.description}</p>
            <p>Precio: ${producto.price}</p>
            <p>Stock: ${producto.stock}</p>
            <p>Owner: ${producto.owner}</p>
            ${(window.userRole === 'admin' || window.userEmail === producto.owner) ? `<button class="delete-button" data-id="${producto._id}">Eliminar</button>` : ''}
        `;

        contenedorProductos.appendChild(productCard);
    });
});
*/




//CODIGO ORIGINAL QUE FUNCIONA
/*const socket = io(); 

socket.on("productos", (data) => {
    console.log(data);
    renderProductos(data);
})

// Función para renderizar nuestros productos
const renderProductos = (productos) => {
    const contenedorProductos = document.getElementById("contenedorProductos");
    contenedorProductos.innerHTML = "";
    
    productos.docs.forEach(item => {
        const card = document.createElement("div");
        card.classList.add("card");

        card.innerHTML = ` 
            <p>Nombre: ${item.title} </p>
            <p>Precio:$ ${item.price} </p>
            <p>ID: ${item._id} </p>
            <p>Stock: ${item.stock} </p>
            <p>Owner: ${item.owner} </p>
            <button> Eliminar </button>
        `;

        contenedorProductos.appendChild(card);
        
        // Agregamos el evento al botón de eliminar
        card.querySelector("button").addEventListener("click", () => {
            eliminarProducto(item._id);
        });
    });
}

// Función para eliminar un producto
const eliminarProducto = (id) =>  {
    socket.emit("eliminarProducto", id);
    Swal.fire({
        position: "top-end",
        icon: "success",
        title: "Producto eliminado exitosamente",
        showConfirmButton: false,
        timer: 1500
    });
}

// Función para agregar un producto
const agregarProducto = () => {
    const producto = {
        title: document.getElementById("title").value,
        description: document.getElementById("description").value,
        price: document.getElementById("price").value,
        img: document.getElementById("img").value,
        code: document.getElementById("code").value,
        stock: document.getElementById("stock").value,
        category: document.getElementById("category").value,
        status: document.getElementById("status").value === "true",
    };
    
    socket.emit("agregarProducto", producto);
    Swal.fire({
        position: "top-end",
        icon: "success",
        title: "Producto agregado exitosamente",
        showConfirmButton: false,
        timer: 2500
    });
}

// Evento al hacer clic en el botón "Enviar"
document.getElementById("btnEnviar").addEventListener("click", () => {
    console.log("Se recibe la orden de enviar productos en tiempo real (botón enviar)")
    agregarProducto();
    Swal.fire({
        position: "top-end",
        icon: "success",
        title: "Producto agregado exitosamente",
        showConfirmButton: false,
        timer: 2500
    }).then(result => {
        user = result.value;
    })
})*/

