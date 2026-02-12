import { APIGatewayProxyResult } from 'aws-lambda';

export function success<T>(data: T, statusCode: number = 200): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      success: true,
      data,
    }),
  };
}

export function error(message: string, statusCode: number = 400): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      success: false,
      error: message,
    }),
  };
}

export function notFound(message: string = 'Resource not found'): APIGatewayProxyResult {
  return error(message, 404);
}

export function conflict(message: string): APIGatewayProxyResult {
  return error(message, 409);
}

export function unauthorized(message: string = 'Unauthorized'): APIGatewayProxyResult {
  return error(message, 401);
}

export function forbidden(message: string = 'Forbidden'): APIGatewayProxyResult {
  return error(message, 403);
}

