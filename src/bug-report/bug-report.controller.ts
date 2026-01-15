import {
    Controller,
    Post,
    Body,
    HttpStatus,
    Req,
} from '@nestjs/common';
import { BugReportService } from './bug-report.service';
import type { CreateBugReportDto } from './dto/create-bug-report.dto';
import { JoiValidationPipe } from 'src/common/joi-validation.pipe';
import { createBugReportSchema } from './validation/bug-report.validation';
import { ApiResponse } from 'src/common/api-response';
import { MESSAGE } from 'src/common/response-messages';

@Controller('bug-reports')
export class BugReportController {
    constructor(private readonly bugReportService: BugReportService) { }

    @Post()
    async create(
        @Req() req: any,
        @Body(new JoiValidationPipe(createBugReportSchema))
        createBugReportDto: CreateBugReportDto,
    ) {
        // Extract user ID if authenticated, otherwise null
        console.log(req.user);
        const userId = req.user?.id ?? null;
        const result = await this.bugReportService.create(userId, createBugReportDto);
        return ApiResponse.success(
            HttpStatus.CREATED,
            MESSAGE.SUCCESS.BUG_REPORT.SUBMITTED,
            result,
        );
    }
}
