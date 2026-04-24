import { Request, Response, NextFunction } from 'express';
import { CampaignController } from '@controllers/CampaignController';
import { campaignService } from '@services/CampaignService';

// Mock the CampaignService module
jest.mock('@services/CampaignService', () => ({
  CampaignService: jest.fn().mockImplementation(() => ({
    createCampaign: jest.fn(),
    getCampaignById: jest.fn(),
    listCampaigns: jest.fn(),
    updateCampaign: jest.fn(),
    deleteCampaign: jest.fn(),
    scheduleCampaign: jest.fn(),
    sendCampaign: jest.fn(),
    getCampaignStats: jest.fn(),
  })),
  campaignService: {
    createCampaign: jest.fn(),
    getCampaignById: jest.fn(),
    listCampaigns: jest.fn(),
    updateCampaign: jest.fn(),
    deleteCampaign: jest.fn(),
    scheduleCampaign: jest.fn(),
    sendCampaign: jest.fn(),
    getCampaignStats: jest.fn(),
  },
}));

describe('CampaignController', () => {
  let campaignController: CampaignController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    campaignController = new CampaignController();

    mockRequest = {
      userId: 'test-user-id',
      query: {},
      params: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('listCampaigns', () => {
    it('should list campaigns with default pagination', async () => {
      mockRequest.query = {};


      campaignService.listCampaigns = jest.fn().mockResolvedValue({
        campaigns: [
          {
            id: 'campaign-1',
            name: 'Test Campaign',
            subject: 'Test Subject',
            body: 'Test Body',
            status: 'draft',
            scheduled_at: null,
            created_by: 'test-user-id',
            created_at: new Date(),
            updated_at: new Date(),
            recipient_count: 5,
          },
        ],
        total: 1,
      }) as any;

      await campaignController.listCampaigns(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          campaigns: expect.any(Array),
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            total_pages: 1,
            has_next: false,
            has_prev: false,
          },
        },
      });
    });

    it('should list campaigns with custom pagination', async () => {
      mockRequest.query = {
        page: '2',
        limit: '10',
      };


      campaignService.listCampaigns = jest.fn().mockResolvedValue({
        campaigns: [],
        total: 25,
      }) as any;

      await campaignController.listCampaigns(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(campaignService.listCampaigns).toHaveBeenCalledWith(
        'test-user-id',
        2,
        10,
        undefined
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          campaigns: [],
          pagination: {
            page: 2,
            limit: 10,
            total: 25,
            total_pages: 3,
            has_next: true,
            has_prev: true,
          },
        },
      });
    });

    it('should filter campaigns by status', async () => {
      mockRequest.query = {
        status: 'draft',
        page: '1',
        limit: '20',
      };


      campaignService.listCampaigns = jest.fn().mockResolvedValue({
        campaigns: [],
        total: 5,
      }) as any;

      await campaignController.listCampaigns(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(campaignService.listCampaigns).toHaveBeenCalledWith(
        'test-user-id',
        1,
        20,
        'draft'
      );
    });

    it('should return validation error for invalid status', async () => {
      mockRequest.query = {
        status: 'invalid_status',
      };

      await campaignController.listCampaigns(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid status value. Must be one of: draft, scheduled, sent',
        },
      });
    });

    it('should calculate pagination metadata correctly', async () => {
      mockRequest.query = {
        page: '3',
        limit: '10',
      };


      campaignService.listCampaigns = jest.fn().mockResolvedValue({
        campaigns: [],
        total: 45,
      }) as any;

      await campaignController.listCampaigns(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          campaigns: [],
          pagination: {
            page: 3,
            limit: 10,
            total: 45,
            total_pages: 5,
            has_next: true,
            has_prev: true,
          },
        },
      });
    });
  });

  describe('createCampaign', () => {
    it('should create campaign successfully', async () => {
      const validInput = {
        name: 'Test Campaign',
        subject: 'Test Subject',
        body: 'Test Body with enough content',
        recipient_ids: ['uuid-1', 'uuid-2'],
      };

      mockRequest.body = validInput;
      mockRequest.params = {};


      campaignService.createCampaign = jest.fn().mockResolvedValue({
        id: 'new-campaign-id',
        ...validInput,
        status: 'draft',
        scheduled_at: null,
        created_by: 'test-user-id',
        created_at: new Date(),
        updated_at: new Date(),
        recipient_count: 2,
      }) as any;

      await campaignController.createCampaign(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: 'new-campaign-id',
          name: 'Test Campaign',
          status: 'draft',
        }),
      });
    });
  });

  describe('getCampaign', () => {
    it('should get campaign by id', async () => {
      mockRequest.params = { id: 'campaign-123' };


      campaignService.getCampaignById = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        name: 'Test Campaign',
        subject: 'Test Subject',
        body: 'Test Body',
        status: 'draft',
        scheduled_at: null,
        created_by: 'test-user-id',
        created_at: new Date(),
        updated_at: new Date(),
      }) as any;

      await campaignController.getCampaign(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(campaignService.getCampaignById).toHaveBeenCalledWith(
        'campaign-123',
        'test-user-id'
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: 'campaign-123',
        }),
      });
    });
  });

  describe('updateCampaign', () => {
    it('should update campaign successfully', async () => {
      mockRequest.params = { id: 'campaign-123' };
      mockRequest.body = {
        name: 'Updated Campaign Name',
      };


      campaignService.updateCampaign = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        name: 'Updated Campaign Name',
        subject: 'Test Subject',
        body: 'Test Body',
        status: 'draft',
        scheduled_at: null,
        created_by: 'test-user-id',
        created_at: new Date(),
        updated_at: new Date(),
      }) as any;

      await campaignController.updateCampaign(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(campaignService.updateCampaign).toHaveBeenCalledWith(
        'campaign-123',
        { name: 'Updated Campaign Name' },
        'test-user-id'
      );
    });
  });

  describe('deleteCampaign', () => {
    it('should delete campaign successfully', async () => {
      mockRequest.params = { id: 'campaign-123' };


      campaignService.deleteCampaign = jest.fn().mockResolvedValue(undefined) as any;

      await campaignController.deleteCampaign(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(campaignService.deleteCampaign).toHaveBeenCalledWith(
        'campaign-123',
        'test-user-id'
      );

      expect(mockResponse.send).toHaveBeenCalled();
    });
  });
});
