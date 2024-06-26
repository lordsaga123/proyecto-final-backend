class UserDto {
    constructor(first_name, last_name, email, role, last_connection) {
        this.first_name = first_name;
        this.last_name = last_name;
        this.role = role;
        this.email = email;
        this.last_connection = last_connection;
    }
}

module.exports = UserDto;