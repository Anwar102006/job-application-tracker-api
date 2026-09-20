export class ApiResponse {
  constructor(statusCode, data, message = 'Success', meta = undefined) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
    if (meta !== undefined) {
      this.meta = meta;
    }
  }
}
