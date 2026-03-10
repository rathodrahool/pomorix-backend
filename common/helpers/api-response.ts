export class ApiResponse {
  static success(statusCode: number, message: string, data: any = {}) {
    return {
      success: true,
      status_code: statusCode,
      message,
      data,
    };
  }

  static successPaginated(
    statusCode: number,
    message: string,
    data: any[],
    meta: { total: number; page: number; pageSize: number; totalPages: number },
  ) {
    return {
      success: true,
      status_code: statusCode,
      message,
      data,
      meta,
    };
  }

  static error(statusCode: number, message: string, data: any = {}) {
    return {
      success: false,
      status_code: statusCode,
      message,
      data,
    };
  }
}
