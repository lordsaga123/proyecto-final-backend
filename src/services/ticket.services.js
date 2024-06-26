const TicketModel = require("../dao/models/ticket.model");

class TicketService {
    async crearTicket(ticketData) {
        try {
            const ticket = new TicketModel(ticketData);
            await ticket.save();
            return ticket;
        } catch (error) {
            throw new Error("Error");
        }
    }
}

module.exports = TicketService;