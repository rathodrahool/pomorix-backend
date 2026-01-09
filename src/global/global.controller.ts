import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { GlobalService } from './global.service';
import { JoiValidationPipe } from 'src/common/joi-validation.pipe';
import { globalFeedQuerySchema } from './validation/global-feed.validation';
import type { GlobalFeedQueryDto } from './dto/global-feed.dto';
import { ApiResponse } from 'src/common/api-response';
import { MESSAGE } from 'src/common/response-messages';

@Controller('global')
export class GlobalController {
    constructor(private readonly globalService: GlobalService) { }

    @Get('feed')
    async getFeed(
        @Query(new JoiValidationPipe(globalFeedQuerySchema))
        query: GlobalFeedQueryDto,
    ) {
        const result = await this.globalService.getGlobalFeed(query);
        return ApiResponse.success(
            HttpStatus.OK,
            MESSAGE.SUCCESS.GLOBAL.FEED_RETRIEVED,
            result,
        );
    }
}
