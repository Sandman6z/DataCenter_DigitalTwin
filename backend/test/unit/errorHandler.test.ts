import { Request, Response, NextFunction } from 'express';
import { errorHandler, asyncHandler } from '../../src/middleware/errorHandler';

describe('ErrorHandler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('errorHandler', () => {
    it('should handle Error objects', () => {
      const error = new Error('Test error');
      const statusCode = 500;
      const message = 'Test error';

      errorHandler(error as any, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(statusCode);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: message
      });
    });

    it('should handle custom error objects with statusCode and message', () => {
      const error = {
        status: 404,
        message: 'Not found'
      };

      errorHandler(error as any, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Not found'
      });
    });

    it('should use default status code 500 for errors without statusCode', () => {
      const error = {
        message: 'Internal server error'
      };

      errorHandler(error as any, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Internal server error'
      });
    });

    it('should use default message for errors without message', () => {
      const error = {};

      errorHandler(error as any, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Internal server error'
      });
    });
  });

  describe('asyncHandler', () => {
    it('should catch and pass errors from async functions', async () => {
      const error = new Error('Async error');
      const asyncFn = async (_req: Request, _res: Response, _next: NextFunction) => {
        throw error;
      };

      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should call next() with no arguments if no error occurs', async () => {
      const asyncFn = async (_req: Request, _res: Response, next: NextFunction) => {
        next();
      };

      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
